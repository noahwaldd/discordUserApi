import { client } from "../index.js";
import dayjs from "dayjs";
import { NITRO_LEVELS, BOOST_LEVELS, BOOST_MONTHS } from "../utils/constants.js";

function getCurrentNitroBadge(months, nitroSinceDate) {
  if (!nitroSinceDate) {
    return { badge: null, currentBadgeDate: null };
  }

  const currentBadge = NITRO_LEVELS.find((badge) => {
    const inLowerLimit = months >= badge.lowerLimit;
    const inUpperLimit = typeof badge.upperLimit === "undefined" || months <= badge.upperLimit;
    return inLowerLimit && inUpperLimit;
  });
  return { badge: currentBadge?.badge || null, currentBadgeDate: nitroSinceDate };
}

function getNextNitroBadge(months, nitroSinceDate) {
  if (!nitroSinceDate) {
    return { badge: null, nextBadgeDate: null };
  }

  for (let i = 0; i < NITRO_LEVELS.length; i++) {
    const badge = NITRO_LEVELS[i];
    if (months >= badge.lowerLimit && (typeof badge.upperLimit === "undefined" || months <= badge.upperLimit)) {
      const nextBadge = NITRO_LEVELS[i + 1];
      if (nextBadge) {
        const nextBadgeDate = nitroSinceDate.add(nextBadge.lowerLimit, "months");
        return { badge: nextBadge.badge, nextBadgeDate };
      }
      return { badge: "max_badge", nextBadgeDate: null };
    }
  }
}

function getCurrentBoostLevel(months) {
  const currentLevel = BOOST_LEVELS.find((level) => {
    if (level.upperLimit) {
      return months >= level.lowerLimit && months <= level.upperLimit;
    } else {
      return months >= level.lowerLimit;
    }
  })?.level;

  return currentLevel || null;
}

function getNextBoostLevel(months) {
  for (let i = 0; i < BOOST_LEVELS.length; i++) {
    const level = BOOST_LEVELS[i];
    if (months >= level.lowerLimit) {
      if (typeof level.upperLimit === "undefined" || months <= level.upperLimit) {
        const nextLevel = BOOST_LEVELS[i + 1];
        return nextLevel ? nextLevel.level : "max_level";
      }
    }
  }
}

function getUserBadges(response) {
  const userBadges = response?.badges?.map((badge) => badge.id);
  return userBadges?.length > 0 ? userBadges : [];
}

function getSpotifyActivity(activities) {
  const spotifyActivity = activities.find(activity => activity.type === 2 && activity.name === "Spotify");
  if (!spotifyActivity) return null;

  return {
    song: spotifyActivity.details,
    artist: spotifyActivity.state,
    album: spotifyActivity.assets?.large_text,
    album_cover_url: spotifyActivity.assets ? `https://i.scdn.co/image/${spotifyActivity.assets.large_image.slice(8)}` : null,
    start_timestamp: spotifyActivity.timestamps?.start,
    end_timestamp: spotifyActivity.timestamps?.end,
  };
}

function formatUserData(response, target, presence) {
  const bannerUrl = response?.user_profile?.banner 
    ? `https://cdn.discordapp.com/banners/${response.user.id}/${response.user_profile.banner}${response.user_profile.banner.startsWith("a_") ? ".gif?size=4096" : ".png?size=4096"}`
    : null;

  const avatarDecorationUrl = response.user.avatar_decoration_data 
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${response.user.avatar_decoration_data.asset}.png?size=160` 
    : null;

  const clanIconUrl = response.user.clan 
    ? `https://cdn.discordapp.com/clan-badges/${response.user.clan.identity_guild_id}/${response.user.clan.badge}.png?size=16`
    : null;

  return {
    id: response.user.id,
    createdAt: target.createdAt,
    createdTimestamp: target.createdTimestamp,
    username: response.user.username,
    tag: target.tag,
    global_name: response.user.global_name,
    legacy_username: response?.legacy_username || null,
    avatar_url: target.displayAvatarURL({ size: 4096, extension: "png" }),
    banner_url: bannerUrl,
    avatar_decoration_data: response.user.avatar_decoration_data || null,
    avatar_decoration_url: avatarDecorationUrl,
    status: presence?.status || "offline",
    activities: presence?.activities || [],
    spotify: getSpotifyActivity(presence?.activities || []),
  };
}

function formatUserProfileData(response) {
  const theme_colors = response?.user_profile?.theme_colors;
  const colorsArray = theme_colors ? Object.values(theme_colors).map((color) => `#${color.toString(16).padStart(6, "0")}`) : [];
  
  return {
    bio: response?.user_profile?.bio || null,
    pronouns: response?.user_profile?.pronouns || null,
    theme_colors: colorsArray.join(", ") || null,
  };
}

function formatNitroBoostData(response) {
  const currentDate = dayjs();
  const nitroSinceDate = response?.premium_since ? dayjs(response.premium_since) : null;
  const premiumSinceDate = dayjs(response?.premium_guild_since);
  const monthsPassedNitro = nitroSinceDate ? currentDate.diff(nitroSinceDate, "month") : 0;
  const monthsPassedBoost = premiumSinceDate ? currentDate.diff(premiumSinceDate, "month") : 0;

  // Datas futuras para os próximos níveis de boost
  const nextBoostDates = BOOST_MONTHS
    .map(months => premiumSinceDate.add(months, "months"))
    .filter(date => currentDate.isBefore(date))
    .map(date => date.format());

  const currentNitroBadgeData = getCurrentNitroBadge(monthsPassedNitro, nitroSinceDate);
  const nextNitroBadgeData = getNextNitroBadge(monthsPassedNitro, nitroSinceDate);
  const currentBoostLevel = getCurrentBoostLevel(monthsPassedBoost);
  const nextBoostLevel = getNextBoostLevel(monthsPassedBoost);

  return {
    premium_type: response?.premium_type === 1 ? "nitro_classic" : response?.premium_type === 2 ? "nitro_boost" : response?.premium_type === 3 ? "nitro_basic" : null,
    premium_since: response?.premium_since,
    premium_guild_since: response?.premium_guild_since,
    current_badge: currentNitroBadgeData?.badge || null,
    current_badge_date: currentNitroBadgeData?.currentBadgeDate || null,
    next_badge: nextNitroBadgeData?.badge || null,
    next_badge_date: nextNitroBadgeData?.nextBadgeDate || null,
    boost_level: currentBoostLevel,
    next_boost_level: nextBoostLevel,
    boost_since: premiumSinceDate,
    next_boost_dates: nextBoostDates,
  };
}

async function getUserResponse(response, presence) {
  if (!response) {
    throw new Error("Response is undefined or null");
  }

  const target = response?.user ? await client.users.fetch(response.user.id) : null;
  if (!target) {
    throw new Error("User fetch failed");
  }

  const badges = getUserBadges(response);
  const currentNitroBadgeData = getCurrentNitroBadge(
    dayjs().diff(dayjs(response?.premium_since), "month"),
    response?.premium_since ? dayjs(response.premium_since) : null
  );

  if (currentNitroBadgeData?.badge) {
    badges.unshift(currentNitroBadgeData.badge);
  }

  return {
    user: formatUserData(response, target, presence),
    clan: {
      clan: response.user.clan || null,
      clanbadge: response.user.clan 
        ? `https://cdn.discordapp.com/clan-badges/${response.user.clan.identity_guild_id}/${response.user.clan.badge}.png?size=16`
        : null,
    },
    user_profile: formatUserProfileData(response),
    nitro: formatNitroBoostData(response),
    badges,
  };
}

export { getUserResponse };