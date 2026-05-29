# mongo-collection-cleaner

Interactive CLI tool to drop multiple MongoDB collections at once.

## Install

```bash
npm install -g mongo-collection-cleaner
```

## Usage

```bash
mcc
```

The tool will guide you through:

1. **MongoDB URI** — confirm or enter a custom one
2. **Database name** — confirm or enter a custom one
3. **Collections to drop** — confirm the default list or enter your own
4. **Final confirmation** — type `yes` to proceed

Nothing is deleted until you type `yes` at the final prompt.

## Configuration (optional)

Create a `.env` file **in the same directory where `mcc` is installed** (i.e. next to `index.js`) to set defaults:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=myDatabase
MONGO_COLLECTIONS=classrooms,courses,departments,exams,examPrograms,teachers,enrollments
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
