import pkg from "express";

export const method = "get";
export const name = "/";
export const execute = async (req, res) => {
  res.status(200).json({
    status: 200,
    routes: "/profile/user/:id",
  });
};