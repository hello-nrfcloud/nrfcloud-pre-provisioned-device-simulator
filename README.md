# nRF Cloud device simulator

Simulates a pre-provisioned device on nRF Cloud that is ready to connect.

## Setup

Export your nRF Cloud API key and team ID (see [`.envrc.dist`](./.envrc.dist)).

## Generate Device certificates

> **Note**
> Below commands are for OpenSSL version 3.

```bash
mkdir ./certificates
```

### Generate a new CA

> All commands are for OpenSSL v3

```bash
CA_ID=`uuidgen | tr -d '\n'`
# CA Private key
openssl genrsa -out ./certificates/CA.${CA_ID}.key 2048
# CA Certificate, create one per production run
CN="Production Run Test"
OU="Cellular IoT Applications Team"
openssl req -x509 -new -nodes -key ./certificates/CA.${CA_ID}.key -sha256 -days 30 -out ./certificates/CA.${CA_ID}.cert -subj "/OU=${OU}, CN=${CN}"
```

### Generate a device certificate

```bash
# Generate IMEI
IMEI="3566642`shuf -i 10000000-99999999 -n 1 | tr -d '\n'`"
# Prefix IMEI so it can be distinguished from user devices
deviceID="oob-${IMEI}"
# Device Private key
openssl ecparam -out ./certificates/device.${deviceID}.key -name prime256v1 -genkey
# Device Certificate
openssl req -x509 -new -nodes -key ./certificates/device.${deviceID}.key -sha256 -days 10680 -out ./certificates/device.${deviceID}.cert -subj "/CN=${deviceID}"
```

### Sign key with cert

```bash
openssl req -key ./certificates/device.${deviceID}.key -new -out ./certificates/device.${deviceID}.csr -subj "/CN=${deviceID}"
openssl x509 -req -CA ./certificates/CA.${CA_ID}.cert -CAkey ./certificates/CA.${CA_ID}.key -in ./certificates/device.${deviceID}.csr -out ./certificates/device.${deviceID}.signed.cert -days 10680
```

### View signed cert

```bash
openssl x509 -text -noout -in ./certificates/device.${deviceID}.signed.cert
```

## Register device

```bash
node register-device.js ${deviceID}
```

## Connect device

```bash
node simulator.js ${deviceID}
```
