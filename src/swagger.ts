import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Omuz CRM Backend API",
      version: "1.0.0",
      description: "Ҳуҷҷати автоматии API, аз рӯи аннотатсияҳои JSDoc дар src/modules/**/*.routes.ts сохта шудааст.",
    },
    servers: [{ url: "/api", description: "API (бо токен, ба ғайр аз /auth/*)" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.ts"],
});
