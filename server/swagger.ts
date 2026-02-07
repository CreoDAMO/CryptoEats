import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CryptoEats Platform API",
      version: "1.0.0",
      description: "The Delivery Layer — Full-featured food & alcohol delivery platform with blockchain integration, NFT rewards, escrow payments, and open API platform. Build on top of CryptoEats to power your own delivery experience.",
      contact: {
        name: "CryptoEats Developer Support",
        email: "developers@cryptoeats.io",
      },
      license: {
        name: "Proprietary",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "Platform API v1",
      },
      {
        url: "/api",
        description: "Internal API",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Your CryptoEats public API key (ce_pk_...)",
        },
        ApiSecretAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Secret",
          description: "Your CryptoEats secret API key (ce_sk_...)",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for user authentication",
        },
      },
      schemas: {
        Restaurant: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            cuisineType: { type: "string" },
            address: { type: "string" },
            rating: { type: "number" },
            deliveryFee: { type: "string" },
            estimatedPrepTime: { type: "string" },
            alcoholLicense: { type: "boolean" },
            imageUrl: { type: "string" },
            featured: { type: "boolean" },
          },
        },
        MenuItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            restaurantId: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "string" },
            category: { type: "string" },
            isAlcohol: { type: "boolean" },
            dietaryTags: { type: "array", items: { type: "string" } },
            available: { type: "boolean" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            customerId: { type: "string" },
            driverId: { type: "string", nullable: true },
            restaurantId: { type: "string" },
            status: { type: "string", enum: ["pending", "confirmed", "preparing", "picked_up", "arriving", "delivered", "cancelled"] },
            items: { type: "array", items: { type: "object" } },
            subtotal: { type: "string" },
            total: { type: "string" },
            paymentMethod: { type: "string" },
            deliveryAddress: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        InboundOrder: {
          type: "object",
          required: ["externalOrderId", "source", "customerName", "deliveryAddress", "items", "subtotal", "total"],
          properties: {
            externalOrderId: { type: "string" },
            source: { type: "string", description: "Source platform (e.g., shopify, toast, woocommerce)" },
            customerName: { type: "string" },
            customerPhone: { type: "string" },
            customerEmail: { type: "string", format: "email" },
            deliveryAddress: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "integer" },
                  isAlcohol: { type: "boolean" },
                },
              },
            },
            subtotal: { type: "number" },
            deliveryFee: { type: "number" },
            tip: { type: "number" },
            total: { type: "number" },
            specialInstructions: { type: "string" },
            metadata: { type: "object" },
          },
        },
        TaxCalculation: {
          type: "object",
          properties: {
            taxAmount: { type: "number" },
            taxRate: { type: "number" },
            taxableAmount: { type: "number" },
          },
        },
        ApiKeyCreate: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            tier: { type: "string", enum: ["free", "starter", "pro", "enterprise"], default: "free" },
            isSandbox: { type: "boolean", default: true },
          },
        },
        WebhookCreate: {
          type: "object",
          required: ["url", "events"],
          properties: {
            url: { type: "string", format: "uri" },
            events: {
              type: "array",
              items: { type: "string" },
              description: "Events to subscribe to (e.g., order.created, delivery.completed)",
            },
          },
        },
        WhiteLabelConfig: {
          type: "object",
          required: ["brandName"],
          properties: {
            brandName: { type: "string" },
            primaryColor: { type: "string" },
            secondaryColor: { type: "string" },
            accentColor: { type: "string" },
            logoUrl: { type: "string", format: "uri" },
            customDomain: { type: "string" },
            supportEmail: { type: "string", format: "email" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            meta: {
              type: "object",
              properties: {
                count: { type: "integer" },
                sandbox: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    paths: {
      "/restaurants": {
        get: {
          tags: ["Restaurants"],
          summary: "List all restaurants",
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: "cuisine", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "featured", in: "query", schema: { type: "boolean" } },
          ],
          responses: { "200": { description: "List of restaurants" } },
        },
      },
      "/restaurants/{id}": {
        get: {
          tags: ["Restaurants"],
          summary: "Get restaurant by ID",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Restaurant details" }, "404": { description: "Not found" } },
        },
      },
      "/restaurants/{id}/menu": {
        get: {
          tags: ["Restaurants"],
          summary: "Get restaurant menu items",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Menu items" } },
        },
      },
      "/orders": {
        get: {
          tags: ["Orders"],
          summary: "List all orders",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "List of orders" } },
        },
      },
      "/orders/{id}": {
        get: {
          tags: ["Orders"],
          summary: "Get order by ID",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Order details" }, "404": { description: "Not found" } },
        },
      },
      "/orders/{id}/status": {
        put: {
          tags: ["Orders"],
          summary: "Update order status",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } } } },
          },
          responses: { "200": { description: "Updated order" } },
        },
      },
      "/drivers": {
        get: {
          tags: ["Drivers"],
          summary: "List all drivers",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "List of drivers" } },
        },
      },
      "/drivers/available": {
        get: {
          tags: ["Drivers"],
          summary: "List available drivers",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Available drivers" } },
        },
      },
      "/tax/jurisdictions": {
        get: {
          tags: ["Tax"],
          summary: "List tax jurisdictions",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Tax jurisdictions" } },
        },
      },
      "/tax/calculate": {
        post: {
          tags: ["Tax"],
          summary: "Calculate tax for an amount",
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { subtotal: { type: "number" }, rate: { type: "number" } } } } },
          },
          responses: { "200": { description: "Tax calculation result" } },
        },
      },
      "/nft/marketplace": {
        get: {
          tags: ["NFT"],
          summary: "List NFT marketplace listings",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "NFT listings" } },
        },
      },
      "/integrations/orders/inbound": {
        post: {
          tags: ["Integrations"],
          summary: "Submit inbound order from external system",
          description: "Receive orders from external platforms like Shopify, WooCommerce, Toast POS, etc.",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/InboundOrder" } } },
          },
          responses: { "201": { description: "Order received" }, "400": { description: "Validation error" } },
        },
        get: {
          tags: ["Integrations"],
          summary: "List inbound orders",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "List of inbound orders" } },
        },
      },
      "/webhooks/external/order": {
        post: {
          tags: ["Integrations"],
          summary: "Receive order status update from external system",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { orderId: { type: "string" }, status: { type: "string" }, source: { type: "string" } } } } },
          },
          responses: { "200": { description: "Update received" } },
        },
      },
      "/webhooks/external/inventory": {
        post: {
          tags: ["Integrations"],
          summary: "Receive inventory sync from external POS",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { restaurantId: { type: "string" }, items: { type: "array" }, source: { type: "string" } } } } },
          },
          responses: { "200": { description: "Sync received" } },
        },
      },
      "/platform/status": {
        get: {
          tags: ["Platform"],
          summary: "Get platform status and tier information",
          responses: { "200": { description: "Platform status" } },
        },
      },
      "/usage": {
        get: {
          tags: ["Platform"],
          summary: "Get API key usage and rate limit info",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Usage statistics" } },
        },
      },
      "/widget/config": {
        get: {
          tags: ["Widget"],
          summary: "Get widget configuration for embeddable UI",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Widget configuration" } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
