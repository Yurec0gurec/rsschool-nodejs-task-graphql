import { randomInt, randomUUID } from 'node:crypto';
import { test } from 'tap';
import { build } from '../helper.js';
import {
  createPost,
  createProfile,
  createUser,
  getMemberTypes,
  getPosts,
  getPrismaCallsCount,
  getProfiles,
  getUsers,
  gqlQuery,
  subscribeTo,
} from '../utils/requests.js';
import { MemberTypeId } from '../../src/routes/member-types/schemas.js';

await test('gql-loader', async (t) => {
  const app = await build(t);

  await t.test('Get users with their posts, memberTypes.', async (t) => {
    const { body: user1 } = await createUser(app);
    await createPost(app, user1.id);
    await createProfile(app, user1.id, MemberTypeId.BASIC);
    const { body: user2 } = await createUser(app);
    await createPost(app, user2.id);
    await createProfile(app, user2.id, MemberTypeId.BUSINESS);

    await subscribeTo(app, user1.id, user2.id);
    await subscribeTo(app, user2.id, user1.id);

    const {
      body: { count: beforeCount },
    } = await getPrismaCallsCount(app);

    const {
      body: { errors },
    } = await gqlQuery(app, {
      query: `query {
        users {
            id
            posts {
              id
            }
            profile {
              id
              memberType {
                id
              }
            }
            userSubscribedTo {
              id
            }
            subscribedToUser {
              id
            }
        }
    }`,
    });

    const {
      body: { count: afterCount },
    } = await getPrismaCallsCount(app);

    t.ok(!errors);
    t.ok(afterCount - beforeCount <= 6);
  });
});
