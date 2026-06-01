# mongo-collection-cleaner

Interactive CLI tool to drop multiple MongoDB collections at once.

## Install

> **Global installation is required** for the `mcc` command to be available in your terminal.

```bash
npm install -g mongo-collection-cleaner
```

## Demo

![demo](https://eu-west-2.graphassets.com/cm5irx37x0kxf07mkap4yaxi5/cmpuwk1p5fuuj07l4mhcztgwv)

## Usage

```bash
mcc
```

The tool will guide you through:

1. **MongoDB URI** — confirm or enter a custom one
2. **Database name** — confirm or enter a custom one
3. **Collections to drop** — choose from 3 options:
   - Fetch all collections live from the database and select by number
   - Use the default list from `.env`
   - Enter manually (comma-separated)
4. **Final confirmation** — type `yes` to proceed

Nothing is deleted until you type `yes` at the final prompt.

### Selecting collections (option 1)

When you choose to fetch from the database, all existing collections are listed and numbered. You can then pick which ones to drop:

```
  Found 5 collection(s):
    1) users
    2) sessions
    3) logs
    4) cache
    5) orders

  Enter numbers to drop (e.g. 1,3,5) or "all" / "*" / "_" for all:
```

## Configuration (optional)

Create a `.env` file **in the same directory where `mcc` is installed** (i.e. next to `index.js`) to set defaults:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=myDatabase
MONGO_COLLECTIONS=home,employees
```

To find the install location:

```bash
npm root -g
# e.g. /usr/local/lib/node_modules/mongo-collection-cleaner
```

If no `.env` is found, the tool falls back to `mongodb://localhost:27017` with no preset database or collections.

## Requirements

- Node.js >= 20.6.0 (uses the built-in `process.loadEnvFile` API added in v20.6)
- A running MongoDB instance
