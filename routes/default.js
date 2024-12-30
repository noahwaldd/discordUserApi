import pkg from "express";

export const method = "get";
export const name = "/";
export const execute = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  res.status(200).json({
    status: 200,
    routes: "/profile/user/:id",
  });
};