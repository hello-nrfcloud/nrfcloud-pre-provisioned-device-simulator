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
  clientId: deviceId,
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

const shadowTopic = `$aws/things/${deviceId}/shadow/update`;
const updateShadow = async (reported, timeout = 0) => {
  await new Promise((resolve) => setTimeout(resolve, timeout));
  const payload = JSON.stringify({ state: { reported } });
  console.debug(
    chalk.grey(new Date().toISOString()),
    chalk.blue(shadowTopic),
    chalk.magenta(payload)
  );
  client.publish(shadowTopic, payload, { qos: 1 });
};
client.on("disconnect", () => {
  console.debug(chalk.red("disconnected"));
});
client.on("error", () => {
  console.debug(chalk.red("error"));
});
client.on("end", () => {
  console.debug(chalk.red("end"));
});
client.on("message", (topic, payload) => {
  console.debug(chalk.blue(topic), new TextDecoder().decode(payload));
});
client.on("connect", async () => {
  console.log(chalk.green(`Connected`), chalk.blue(deviceId));

  let batteryVoltage = 4300;

  // Publish Device information
  // Config
  updateShadow(
    {
      cfg: {
        act: true,
        loct: 300,
        actwt: 120,
        mvres: 120,
        mvt: 3600,
        accath: 4,
        accith: 4,
        accito: 60,
        nod: [],
      },
    },
    1000
  );
  // Device information
  updateShadow(
    {
      dev: {
        v: {
          imei: deviceId.replace(/[^0-9]/g, ""),
          iccid: "8901234567890123456",
          modV: "mfw_nrf9160_1.3.4",
          brdV: "thingy91_nrf9160",
          appV: "1.10.0+thingy91.debug",
        },
        ts: Date.now(),
      },
      roam: {
        v: {
          band: 12,
          nw: "LTE-M",
          rsrp: -119,
          area: 34635,
          mccmnc: 310410,
          cell: 141255696,
          ip: "10.165.115.123",
          eest: 7,
        },
        ts: Date.now(),
      },
      bat: {
        v: batteryVoltage--,
        ts: Date.now(),
      },
    },
    2000
  );
  // Temperature
  updateShadow(
    {
      env: {
        v: {
          temp: 25.455307006835938,
          hum: 45.33479309082031,
          atmp: 99.29,
          bsec_iaq: 25,
        },
        ts: Date.now(),
      },
    },
    5000
  );
  // GNSS
  updateShadow(
    {
      gnss: {
        v: {
          lng: 63.42111270123654,
          lat: 10.437044339775781,
          acc: 15,
          alt: 100,
          spd: 0,
          hdg: 0,
        },
        ts: Date.now(),
      },
    },
    5000
  );
  // Every 10 seconds send battery voltage updated
  setInterval(() => {
    updateShadow(
      {
        bat: {
          v: batteryVoltage--,
          ts: Date.now(),
        },
      },
      0
    );
  }, 10000);
});
