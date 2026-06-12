import "@server/routes/setupTest";
import { globSync } from "glob";

const files = globSync("src/**/*.ts", {
    ignore: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/*.d.ts", "src/index.ts"],
});

for (const file of files) {
    await import(`./${file}`);
}
