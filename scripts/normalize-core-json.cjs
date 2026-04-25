const fs = require("fs");

const FILES = [
  ["data/core/references.json", "references"],
  ["data/core/location_mentions.json", "location_mentions"],
  ["data/core/spatial_claims.json", "spatial_claims"],
  ["data/core/spatial_terms.json", "spatial_terms"]
];

function flattenWrappedItems(items, key) {
  const flattened = [];

  for (const item of items) {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      Object.keys(item).length === 1 &&
      Array.isArray(item[key])
    ) {
      flattened.push(...flattenWrappedItems(item[key], key));
      continue;
    }

    flattened.push(item);
  }

  return flattened;
}

for (const [file, key] of FILES) {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed[key]) ? parsed[key] : [];
  const flattened = flattenWrappedItems(items, key);

  fs.writeFileSync(
    file,
    `${JSON.stringify({ [key]: flattened }, null, 2)}\n`,
    "utf8"
  );

  console.log(`${file}: ${items.length} -> ${flattened.length}`);
}
