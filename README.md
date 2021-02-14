# Deployment guide

### Step 1: Update contract addresses

Update the contract `address` and `network` in `subgraph.yaml` to the correct values.

### Step 2: Update the package.json

Update `SUBGRAPH_NAME` (e.g. millionpieces/subgraph) and `ACCESS_TOKEN` in `./package.json` to the correct values. If you have not account on [TheGraph](http://thegraph.com/) then create it.

### Step 3: Install npm packages

Run `yarn install`

### Step 4: Codegen

Run `yarn run codegen`

### Step 5: Deploy

Run `yarn run deploy`. The deployed subgraph can be found at https://thegraph.com/explorer/dashboard
