import Env from '@openreachtech/renchan-env'

const {
  EnvironmentFacade,
} = Env

const facade = EnvironmentFacade.create()

/** @type {EnvType} */
export default /** @type {*} */ (
  facade.generateFacade()
)

/**
 * @typedef {import('@openreachtech/renchan-env').EnvironmentFacade.EnvironmentFacadeInterface & {
 *   NODE_ENV: string
 * }} EnvType
 */
