import { readFile } from "node:fs/promises";
import path from "node:path";
import { apiKey, apiBase } from "./api.js";

const deviceId = process.argv[process.argv.length - 1];
console.log(`Registering device`, deviceId);

const body = [
  [
    `nrf-${deviceId}`,
    "PCA10090",
    "family:nRF9|model:PCA10090",
    "APP|MODEM",
    `"${await readFile(
      path.join(
        process.cwd(),
        "certificates",
        `device.${deviceId}.signed.cert`
      ),
      "utf-8"
    )}"`,
  ],
]
  .map((cols) => cols.join(","))
  .join("\n");
console.log(body);

const registrationResult = await fetch(`${apiBase}/devices`, {
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/octet-stream",
  },
  method: "POST",
  body,
});

console.log(await registrationResult.json());
