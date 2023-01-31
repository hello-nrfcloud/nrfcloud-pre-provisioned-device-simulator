import chalk from "chalk";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { apiKey, apiBase } from "./api.js";
import { connect } from "mqtt";

const account = await (
  await fetch(`${apiBase}/account`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
).json();

console.log(chalk.magenta(`MQTT endpoint`), chalk.blue(account.mqttEndpoint));

const deviceId = process.argv[process.argv.length - 1];
console.log(`Connecting device`, deviceId);

const client = connect({
  host: account.mqttEndpoint,
  port: 8883,
  rejectUnauthorized: true,
  clientId: `nrf-${deviceId}`,
  protocol: "mqtts",
  protocolVersion: 4,
  key: await readFile(
    path.join(process.cwd(), "certificates", `device.${deviceId}.key`),
    "utf-8"
  ),
  cert: await readFile(
    path.join(process.cwd(), "certificates", `device.${deviceId}.signed.cert`),
    "utf-8"
  ),
  ca: await readFile(path.join(process.cwd(), "AmazonRootCA1.pem"), "utf-8"),
});
client.on("connect", async () => {
  console.log(chalk.green(`Connected`), chalk.blue(deviceId));
});
