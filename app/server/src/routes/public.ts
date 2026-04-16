import { Hono } from "hono";
import { getResult, getResults } from "../core/presenters/results";

const app = new Hono();

export const routes = app
    .get("/results", ...getResults)
    .get("/results/:id", ...getResult);
