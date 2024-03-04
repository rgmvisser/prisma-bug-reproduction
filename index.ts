import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query", "info", "warn"] });

function getTenantClient(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          let argsWithTenant: Record<string, any> = args;

          if (argsWithTenant?.where?.tenantId) {
            return query(args);
          } else if (argsWithTenant?.where) {
            argsWithTenant.where = {
              ...argsWithTenant.where,
              tenantId: tenantId,
            };
          } else if (argsWithTenant) {
            argsWithTenant.where = { tenantId: tenantId };
          } else {
            argsWithTenant = { where: { tenantId: tenantId } };
          }

          return query(argsWithTenant);
        },
      },
    },
  });
}

type TenantClient = ReturnType<typeof getTenantClient>;

async function main() {
  await prisma.post.deleteMany({});

  const tenant1Client = getTenantClient("tenant1");
  const tenant2Client = getTenantClient("tenant2");

  await prisma.post.create({
    data: {
      id: 1,
      tenantId: "tenant1",
      userId: 1,
      text: "Post 1!",
    },
  });
  await prisma.post.create({
    data: {
      id: 2,
      tenantId: "tenant1",
      userId: 2,
      text: "Post 2!",
    },
  });
  await prisma.post.create({
    data: {
      id: 3,
      tenantId: "tenant2",
      userId: 3,
      text: "Post 3!",
    },
  });
  await prisma.post.create({
    data: {
      id: 4,
      tenantId: "tenant2",
      userId: 4,
      text: "Post 4!",
    },
  });

  const queryPost = (client: TenantClient, tenantId: string, userId: number) =>
    client.post.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

  const concurrentPosts = await Promise.all([
    queryPost(tenant1Client, "tenant1", 1),
    queryPost(tenant2Client, "tenant2", 3),
  ]);

  console.log({ concurrentPosts });

  /* 
 {
  concurrentPosts: [
    { id: 1, tenantId: 'tenant1', userId: 1, text: 'Post 1!' },
    { id: 3, tenantId: 'tenant2', userId: 3, text: 'Post 3!' }
  ]
}
 */
}

main().catch((e) => console.error(e));
