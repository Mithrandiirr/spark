import { TRPCError, initTRPC } from '@trpc/server'
import {  createTRPCContext } from './context'
import superjson from "superjson";
import { ZodError } from 'zod'
type User = {
  id: string
  email: string
  name: string
}


// You can use any variable name you like.
// We use t to keep things simple.
const t = initTRPC.context<typeof createTRPCContext>().create(
  {
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  }
);
export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const publicProcedure = t.procedure

export const authedProcedure = t.procedure.use(async function isAuthed(opts) {
  const { ctx } = opts
  // `ctx.user` is nullable
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    }
  })
})
