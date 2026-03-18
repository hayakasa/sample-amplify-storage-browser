import type { Schema } from "../amplify/data/resource"
import { generateClient } from "aws-amplify/data"

const client = gengrateClient<Schema>

await client.mutations.addUserToGroup({
    groupName: "admin",
    userId: "e7f41a08-f0d1-7037-f085-112fe0aaa985",
})