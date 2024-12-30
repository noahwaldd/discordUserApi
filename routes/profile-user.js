import { client } from "../index.js";
import { getUserResponse } from "../controllers/usersController.js";
import pkg from "express";
import { config } from "dotenv";
import fetch from "node-fetch";

config();

export const method = "get";
export const name = "/profile/user/:id";

export const execute = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { id } = req.params;

  const tokens = process.env.DISCORD_TOKENS?.split(",") || [];

  const getUsers = async () => {
    let response = null;

    for (const token of tokens) {
      try {
        response = await fetch(`https://canary.discord.com/api/v10/users/${id}/profile`, {
          headers: { Authorization: token },
        }).then((res) => res.json());

        if (response && !response.message) {
          break;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const target = await client.users?.fetch(id).catch(() => null);
    if (!target) {
      res.status(400).json({ status: 400, message: "Coloque um id de usuário válido." });
      return;
    }

    if (!response) {
      res.status(500).json({ status: 500, message: "Erro ao obter o perfil do usuário." });
      return;
    }

    try {
      const userResponse = await getUserResponse(response, target.presence);
      res.json(userResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 500, message: "Erro ao processar a resposta do usuário." });
    }
  };

  await getUsers();
};