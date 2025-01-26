'use server'

import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@spark/auth'
import EventEmitter from 'events'
import * as trpcNext from '@trpc/server/adapters/next'
// import { NodeHTTPCreateContextFnOptions } from '@trpc/server/dist/adapters/node-http'
import { getSession } from 'next-auth/react'
import prisma from '@spark/db'

// import authConfig from '~/auth.config'
type CreateContextOptions = {
  session: Session | null
}

export const getServerAuthSession = () => getServerSession(authOptions)

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma
  }
}

export const createTRPCContext = async () => {
  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerAuthSession()

  return createInnerTRPCContext({
    session
  })
}

const ee = new EventEmitter()

export const createContext = async (
  opts?: trpcNext.CreateNextContextOptions 
) => {
  const req = opts?.req
  const res = opts?.res

  const session = req && res && (await getSession({ req }))

  return {
    req,
    res,
    session,
    prisma,
    ee
  }
}
