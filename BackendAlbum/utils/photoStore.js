import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "photos.json");

const ensureStore = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify([]), "utf-8");
  }
};

const readStore = () => {
  ensureStore();
  const content = fs.readFileSync(STORE_PATH, "utf-8") || "[]";
  return JSON.parse(content);
};

const writeStore = (records) => {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), "utf-8");
};

export const addPhotoRecord = async (record) => {
  const records = readStore();
  records.unshift(record);
  writeStore(records);
  return record;
};

export const getPhotoRecords = async () => readStore();
