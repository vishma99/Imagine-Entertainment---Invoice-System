import express from "express";

import { getItems } from "../controllers/itemController.js";

const route = express.Router();
route.get("/", getItems);

export default route;
