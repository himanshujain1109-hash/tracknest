import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

sqlite3.verbose();

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const backendRoot =
  path.resolve(__dirname, "..");

const dataDirectory =
  path.join(backendRoot, "data");

fs.mkdirSync(
  dataDirectory,
  { recursive: true }
);

const databasePath =
  path.join(
    dataDirectory,
    "inventory.db"
  );

const db =
  new sqlite3.Database(
    databasePath
  );
