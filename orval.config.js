module.exports = {
  api: {
    input: "./openapi.json",
    output: {
      mode: "zod",
      target: "./generated/api.ts",
    },
  },
};
