import { setupServer } from "msw/node";
import { handlers } from "./utils/handlers.js";

export const server = setupServer(...handlers);
