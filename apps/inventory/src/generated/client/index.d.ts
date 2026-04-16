
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model Location
 * 
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>
/**
 * Model Item
 * 
 */
export type Item = $Result.DefaultSelection<Prisma.$ItemPayload>
/**
 * Model InventoryLog
 * 
 */
export type InventoryLog = $Result.DefaultSelection<Prisma.$InventoryLogPayload>
/**
 * Model InventoryBorrowing
 * 
 */
export type InventoryBorrowing = $Result.DefaultSelection<Prisma.$InventoryBorrowingPayload>
/**
 * Model Setting
 * 
 */
export type Setting = $Result.DefaultSelection<Prisma.$SettingPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model ItemAudit
 * 
 */
export type ItemAudit = $Result.DefaultSelection<Prisma.$ItemAuditPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Categories
 * const categories = await prisma.category.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Categories
   * const categories = await prisma.category.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs>;

  /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locations
    * const locations = await prisma.location.findMany()
    * ```
    */
  get location(): Prisma.LocationDelegate<ExtArgs>;

  /**
   * `prisma.item`: Exposes CRUD operations for the **Item** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Items
    * const items = await prisma.item.findMany()
    * ```
    */
  get item(): Prisma.ItemDelegate<ExtArgs>;

  /**
   * `prisma.inventoryLog`: Exposes CRUD operations for the **InventoryLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InventoryLogs
    * const inventoryLogs = await prisma.inventoryLog.findMany()
    * ```
    */
  get inventoryLog(): Prisma.InventoryLogDelegate<ExtArgs>;

  /**
   * `prisma.inventoryBorrowing`: Exposes CRUD operations for the **InventoryBorrowing** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InventoryBorrowings
    * const inventoryBorrowings = await prisma.inventoryBorrowing.findMany()
    * ```
    */
  get inventoryBorrowing(): Prisma.InventoryBorrowingDelegate<ExtArgs>;

  /**
   * `prisma.setting`: Exposes CRUD operations for the **Setting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Settings
    * const settings = await prisma.setting.findMany()
    * ```
    */
  get setting(): Prisma.SettingDelegate<ExtArgs>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.itemAudit`: Exposes CRUD operations for the **ItemAudit** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ItemAudits
    * const itemAudits = await prisma.itemAudit.findMany()
    * ```
    */
  get itemAudit(): Prisma.ItemAuditDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Category: 'Category',
    Location: 'Location',
    Item: 'Item',
    InventoryLog: 'InventoryLog',
    InventoryBorrowing: 'InventoryBorrowing',
    Setting: 'Setting',
    User: 'User',
    ItemAudit: 'ItemAudit'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "category" | "location" | "item" | "inventoryLog" | "inventoryBorrowing" | "setting" | "user" | "itemAudit"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>
        fields: Prisma.LocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocation>
          }
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>
            result: $Utils.Optional<LocationCountAggregateOutputType> | number
          }
        }
      }
      Item: {
        payload: Prisma.$ItemPayload<ExtArgs>
        fields: Prisma.ItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          findFirst: {
            args: Prisma.ItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          findMany: {
            args: Prisma.ItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          create: {
            args: Prisma.ItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          createMany: {
            args: Prisma.ItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          delete: {
            args: Prisma.ItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          update: {
            args: Prisma.ItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          deleteMany: {
            args: Prisma.ItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          aggregate: {
            args: Prisma.ItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateItem>
          }
          groupBy: {
            args: Prisma.ItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<ItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.ItemCountArgs<ExtArgs>
            result: $Utils.Optional<ItemCountAggregateOutputType> | number
          }
        }
      }
      InventoryLog: {
        payload: Prisma.$InventoryLogPayload<ExtArgs>
        fields: Prisma.InventoryLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InventoryLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InventoryLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>
          }
          findFirst: {
            args: Prisma.InventoryLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InventoryLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>
          }
          findMany: {
            args: Prisma.InventoryLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>[]
          }
          create: {
            args: Prisma.InventoryLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>
          }
          createMany: {
            args: Prisma.InventoryLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InventoryLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>[]
          }
          delete: {
            args: Prisma.InventoryLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>
          }
          update: {
            args: Prisma.InventoryLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>
          }
          deleteMany: {
            args: Prisma.InventoryLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InventoryLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.InventoryLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryLogPayload>
          }
          aggregate: {
            args: Prisma.InventoryLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInventoryLog>
          }
          groupBy: {
            args: Prisma.InventoryLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<InventoryLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.InventoryLogCountArgs<ExtArgs>
            result: $Utils.Optional<InventoryLogCountAggregateOutputType> | number
          }
        }
      }
      InventoryBorrowing: {
        payload: Prisma.$InventoryBorrowingPayload<ExtArgs>
        fields: Prisma.InventoryBorrowingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InventoryBorrowingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InventoryBorrowingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>
          }
          findFirst: {
            args: Prisma.InventoryBorrowingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InventoryBorrowingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>
          }
          findMany: {
            args: Prisma.InventoryBorrowingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>[]
          }
          create: {
            args: Prisma.InventoryBorrowingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>
          }
          createMany: {
            args: Prisma.InventoryBorrowingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InventoryBorrowingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>[]
          }
          delete: {
            args: Prisma.InventoryBorrowingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>
          }
          update: {
            args: Prisma.InventoryBorrowingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>
          }
          deleteMany: {
            args: Prisma.InventoryBorrowingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InventoryBorrowingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.InventoryBorrowingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBorrowingPayload>
          }
          aggregate: {
            args: Prisma.InventoryBorrowingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInventoryBorrowing>
          }
          groupBy: {
            args: Prisma.InventoryBorrowingGroupByArgs<ExtArgs>
            result: $Utils.Optional<InventoryBorrowingGroupByOutputType>[]
          }
          count: {
            args: Prisma.InventoryBorrowingCountArgs<ExtArgs>
            result: $Utils.Optional<InventoryBorrowingCountAggregateOutputType> | number
          }
        }
      }
      Setting: {
        payload: Prisma.$SettingPayload<ExtArgs>
        fields: Prisma.SettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          findFirst: {
            args: Prisma.SettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          findMany: {
            args: Prisma.SettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>[]
          }
          create: {
            args: Prisma.SettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          createMany: {
            args: Prisma.SettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SettingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>[]
          }
          delete: {
            args: Prisma.SettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          update: {
            args: Prisma.SettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          deleteMany: {
            args: Prisma.SettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SettingPayload>
          }
          aggregate: {
            args: Prisma.SettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSetting>
          }
          groupBy: {
            args: Prisma.SettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<SettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.SettingCountArgs<ExtArgs>
            result: $Utils.Optional<SettingCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      ItemAudit: {
        payload: Prisma.$ItemAuditPayload<ExtArgs>
        fields: Prisma.ItemAuditFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ItemAuditFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ItemAuditFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>
          }
          findFirst: {
            args: Prisma.ItemAuditFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ItemAuditFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>
          }
          findMany: {
            args: Prisma.ItemAuditFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>[]
          }
          create: {
            args: Prisma.ItemAuditCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>
          }
          createMany: {
            args: Prisma.ItemAuditCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ItemAuditCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>[]
          }
          delete: {
            args: Prisma.ItemAuditDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>
          }
          update: {
            args: Prisma.ItemAuditUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>
          }
          deleteMany: {
            args: Prisma.ItemAuditDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ItemAuditUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ItemAuditUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemAuditPayload>
          }
          aggregate: {
            args: Prisma.ItemAuditAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateItemAudit>
          }
          groupBy: {
            args: Prisma.ItemAuditGroupByArgs<ExtArgs>
            result: $Utils.Optional<ItemAuditGroupByOutputType>[]
          }
          count: {
            args: Prisma.ItemAuditCountArgs<ExtArgs>
            result: $Utils.Optional<ItemAuditCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    items: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | CategoryCountOutputTypeCountItemsArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
  }


  /**
   * Count Type LocationCountOutputType
   */

  export type LocationCountOutputType = {
    items: number
  }

  export type LocationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | LocationCountOutputTypeCountItemsArgs
  }

  // Custom InputTypes
  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LocationCountOutputType
     */
    select?: LocationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
  }


  /**
   * Count Type ItemCountOutputType
   */

  export type ItemCountOutputType = {
    children: number
    logs: number
    borrowings: number
    audits: number
  }

  export type ItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    children?: boolean | ItemCountOutputTypeCountChildrenArgs
    logs?: boolean | ItemCountOutputTypeCountLogsArgs
    borrowings?: boolean | ItemCountOutputTypeCountBorrowingsArgs
    audits?: boolean | ItemCountOutputTypeCountAuditsArgs
  }

  // Custom InputTypes
  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCountOutputType
     */
    select?: ItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountChildrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryLogWhereInput
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountBorrowingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryBorrowingWhereInput
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountAuditsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemAuditWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    color: string | null
    icon: string | null
    isActive: boolean | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    color: string | null
    icon: string | null
    isActive: boolean | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    name: number
    description: number
    color: number
    icon: number
    isActive: number
    _all: number
  }


  export type CategoryMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    color?: true
    icon?: true
    isActive?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    color?: true
    icon?: true
    isActive?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    color?: true
    icon?: true
    isActive?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: string
    name: string
    description: string | null
    color: string | null
    icon: string | null
    isActive: boolean
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    color?: boolean
    icon?: boolean
    isActive?: boolean
    items?: boolean | Category$itemsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    color?: boolean
    icon?: boolean
    isActive?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    color?: boolean
    icon?: boolean
    isActive?: boolean
  }

  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | Category$itemsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      items: Prisma.$ItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      color: string | null
      icon: string | null
      isActive: boolean
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    items<T extends Category$itemsArgs<ExtArgs> = {}>(args?: Subset<T, Category$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Category model
   */ 
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'String'>
    readonly name: FieldRef<"Category", 'String'>
    readonly description: FieldRef<"Category", 'String'>
    readonly color: FieldRef<"Category", 'String'>
    readonly icon: FieldRef<"Category", 'String'>
    readonly isActive: FieldRef<"Category", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
  }

  /**
   * Category.items
   */
  export type Category$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    cursor?: ItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  export type LocationMinAggregateOutputType = {
    id: string | null
    name: string | null
  }

  export type LocationMaxAggregateOutputType = {
    id: string | null
    name: string | null
  }

  export type LocationCountAggregateOutputType = {
    id: number
    name: number
    _all: number
  }


  export type LocationMinAggregateInputType = {
    id?: true
    name?: true
  }

  export type LocationMaxAggregateInputType = {
    id?: true
    name?: true
  }

  export type LocationCountAggregateInputType = {
    id?: true
    name?: true
    _all?: true
  }

  export type LocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locations
    **/
    _count?: true | LocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocationMaxAggregateInputType
  }

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
        [P in keyof T & keyof AggregateLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>
  }




  export type LocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithAggregationInput | LocationOrderByWithAggregationInput[]
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum
    having?: LocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocationCountAggregateInputType | true
    _min?: LocationMinAggregateInputType
    _max?: LocationMaxAggregateInputType
  }

  export type LocationGroupByOutputType = {
    id: string
    name: string
    _count: LocationCountAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>
        }
      >
    >


  export type LocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    items?: boolean | Location$itemsArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectScalar = {
    id?: boolean
    name?: boolean
  }

  export type LocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | Location$itemsArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Location"
    objects: {
      items: Prisma.$ItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
    }, ExtArgs["result"]["location"]>
    composites: {}
  }

  type LocationGetPayload<S extends boolean | null | undefined | LocationDefaultArgs> = $Result.GetResult<Prisma.$LocationPayload, S>

  type LocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LocationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LocationCountAggregateInputType | true
    }

  export interface LocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Location'], meta: { name: 'Location' } }
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     * 
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const locationWithIdOnly = await prisma.location.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocationFindManyArgs>(args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     * 
     */
    create<T extends LocationCreateArgs>(args: SelectSubset<T, LocationCreateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocationCreateManyArgs>(args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     * 
     */
    delete<T extends LocationDeleteArgs>(args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocationUpdateArgs>(args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocationDeleteManyArgs>(args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocationUpdateManyArgs>(args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
    **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LocationAggregateArgs>(args: Subset<T, LocationAggregateArgs>): Prisma.PrismaPromise<GetLocationAggregateType<T>>

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs['orderBy'] }
        : { orderBy?: LocationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Location model
   */
  readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    items<T extends Location$itemsArgs<ExtArgs> = {}>(args?: Subset<T, Location$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Location model
   */ 
  interface LocationFieldRefs {
    readonly id: FieldRef<"Location", 'String'>
    readonly name: FieldRef<"Location", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location create
   */
  export type LocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>
  }

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
  }

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
  }

  /**
   * Location update
   */
  export type LocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
  }

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
  }

  /**
   * Location delete
   */
  export type LocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput
  }

  /**
   * Location.items
   */
  export type Location$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    cursor?: ItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Location without action
   */
  export type LocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
  }


  /**
   * Model Item
   */

  export type AggregateItem = {
    _count: ItemCountAggregateOutputType | null
    _avg: ItemAvgAggregateOutputType | null
    _sum: ItemSumAggregateOutputType | null
    _min: ItemMinAggregateOutputType | null
    _max: ItemMaxAggregateOutputType | null
  }

  export type ItemAvgAggregateOutputType = {
    stock: number | null
    minStock: number | null
  }

  export type ItemSumAggregateOutputType = {
    stock: number | null
    minStock: number | null
  }

  export type ItemMinAggregateOutputType = {
    id: string | null
    name: string | null
    inventoryCode: string | null
    categoryId: string | null
    type: string | null
    stock: number | null
    minStock: number | null
    unit: string | null
    status: string | null
    statusDetails: string | null
    locationId: string | null
    aisle: string | null
    shelf: string | null
    bin: string | null
    assignedTo: string | null
    imageUrl: string | null
    isApprovalRequired: boolean | null
    isKit: boolean | null
    nextMaintenanceDate: Date | null
    parentId: string | null
    lastUpdated: Date | null
    createdAt: Date | null
  }

  export type ItemMaxAggregateOutputType = {
    id: string | null
    name: string | null
    inventoryCode: string | null
    categoryId: string | null
    type: string | null
    stock: number | null
    minStock: number | null
    unit: string | null
    status: string | null
    statusDetails: string | null
    locationId: string | null
    aisle: string | null
    shelf: string | null
    bin: string | null
    assignedTo: string | null
    imageUrl: string | null
    isApprovalRequired: boolean | null
    isKit: boolean | null
    nextMaintenanceDate: Date | null
    parentId: string | null
    lastUpdated: Date | null
    createdAt: Date | null
  }

  export type ItemCountAggregateOutputType = {
    id: number
    name: number
    inventoryCode: number
    categoryId: number
    type: number
    stock: number
    minStock: number
    unit: number
    status: number
    statusDetails: number
    locationId: number
    aisle: number
    shelf: number
    bin: number
    assignedTo: number
    imageUrl: number
    isApprovalRequired: number
    isKit: number
    nextMaintenanceDate: number
    parentId: number
    lastUpdated: number
    createdAt: number
    _all: number
  }


  export type ItemAvgAggregateInputType = {
    stock?: true
    minStock?: true
  }

  export type ItemSumAggregateInputType = {
    stock?: true
    minStock?: true
  }

  export type ItemMinAggregateInputType = {
    id?: true
    name?: true
    inventoryCode?: true
    categoryId?: true
    type?: true
    stock?: true
    minStock?: true
    unit?: true
    status?: true
    statusDetails?: true
    locationId?: true
    aisle?: true
    shelf?: true
    bin?: true
    assignedTo?: true
    imageUrl?: true
    isApprovalRequired?: true
    isKit?: true
    nextMaintenanceDate?: true
    parentId?: true
    lastUpdated?: true
    createdAt?: true
  }

  export type ItemMaxAggregateInputType = {
    id?: true
    name?: true
    inventoryCode?: true
    categoryId?: true
    type?: true
    stock?: true
    minStock?: true
    unit?: true
    status?: true
    statusDetails?: true
    locationId?: true
    aisle?: true
    shelf?: true
    bin?: true
    assignedTo?: true
    imageUrl?: true
    isApprovalRequired?: true
    isKit?: true
    nextMaintenanceDate?: true
    parentId?: true
    lastUpdated?: true
    createdAt?: true
  }

  export type ItemCountAggregateInputType = {
    id?: true
    name?: true
    inventoryCode?: true
    categoryId?: true
    type?: true
    stock?: true
    minStock?: true
    unit?: true
    status?: true
    statusDetails?: true
    locationId?: true
    aisle?: true
    shelf?: true
    bin?: true
    assignedTo?: true
    imageUrl?: true
    isApprovalRequired?: true
    isKit?: true
    nextMaintenanceDate?: true
    parentId?: true
    lastUpdated?: true
    createdAt?: true
    _all?: true
  }

  export type ItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Item to aggregate.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Items
    **/
    _count?: true | ItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ItemMaxAggregateInputType
  }

  export type GetItemAggregateType<T extends ItemAggregateArgs> = {
        [P in keyof T & keyof AggregateItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateItem[P]>
      : GetScalarType<T[P], AggregateItem[P]>
  }




  export type ItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithAggregationInput | ItemOrderByWithAggregationInput[]
    by: ItemScalarFieldEnum[] | ItemScalarFieldEnum
    having?: ItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ItemCountAggregateInputType | true
    _avg?: ItemAvgAggregateInputType
    _sum?: ItemSumAggregateInputType
    _min?: ItemMinAggregateInputType
    _max?: ItemMaxAggregateInputType
  }

  export type ItemGroupByOutputType = {
    id: string
    name: string
    inventoryCode: string | null
    categoryId: string
    type: string
    stock: number
    minStock: number
    unit: string
    status: string
    statusDetails: string | null
    locationId: string | null
    aisle: string | null
    shelf: string | null
    bin: string | null
    assignedTo: string | null
    imageUrl: string | null
    isApprovalRequired: boolean
    isKit: boolean
    nextMaintenanceDate: Date | null
    parentId: string | null
    lastUpdated: Date
    createdAt: Date
    _count: ItemCountAggregateOutputType | null
    _avg: ItemAvgAggregateOutputType | null
    _sum: ItemSumAggregateOutputType | null
    _min: ItemMinAggregateOutputType | null
    _max: ItemMaxAggregateOutputType | null
  }

  type GetItemGroupByPayload<T extends ItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ItemGroupByOutputType[P]>
            : GetScalarType<T[P], ItemGroupByOutputType[P]>
        }
      >
    >


  export type ItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    inventoryCode?: boolean
    categoryId?: boolean
    type?: boolean
    stock?: boolean
    minStock?: boolean
    unit?: boolean
    status?: boolean
    statusDetails?: boolean
    locationId?: boolean
    aisle?: boolean
    shelf?: boolean
    bin?: boolean
    assignedTo?: boolean
    imageUrl?: boolean
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: boolean
    parentId?: boolean
    lastUpdated?: boolean
    createdAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    location?: boolean | Item$locationArgs<ExtArgs>
    parent?: boolean | Item$parentArgs<ExtArgs>
    children?: boolean | Item$childrenArgs<ExtArgs>
    logs?: boolean | Item$logsArgs<ExtArgs>
    borrowings?: boolean | Item$borrowingsArgs<ExtArgs>
    audits?: boolean | Item$auditsArgs<ExtArgs>
    _count?: boolean | ItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    inventoryCode?: boolean
    categoryId?: boolean
    type?: boolean
    stock?: boolean
    minStock?: boolean
    unit?: boolean
    status?: boolean
    statusDetails?: boolean
    locationId?: boolean
    aisle?: boolean
    shelf?: boolean
    bin?: boolean
    assignedTo?: boolean
    imageUrl?: boolean
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: boolean
    parentId?: boolean
    lastUpdated?: boolean
    createdAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    location?: boolean | Item$locationArgs<ExtArgs>
    parent?: boolean | Item$parentArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectScalar = {
    id?: boolean
    name?: boolean
    inventoryCode?: boolean
    categoryId?: boolean
    type?: boolean
    stock?: boolean
    minStock?: boolean
    unit?: boolean
    status?: boolean
    statusDetails?: boolean
    locationId?: boolean
    aisle?: boolean
    shelf?: boolean
    bin?: boolean
    assignedTo?: boolean
    imageUrl?: boolean
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: boolean
    parentId?: boolean
    lastUpdated?: boolean
    createdAt?: boolean
  }

  export type ItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    location?: boolean | Item$locationArgs<ExtArgs>
    parent?: boolean | Item$parentArgs<ExtArgs>
    children?: boolean | Item$childrenArgs<ExtArgs>
    logs?: boolean | Item$logsArgs<ExtArgs>
    borrowings?: boolean | Item$borrowingsArgs<ExtArgs>
    audits?: boolean | Item$auditsArgs<ExtArgs>
    _count?: boolean | ItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    location?: boolean | Item$locationArgs<ExtArgs>
    parent?: boolean | Item$parentArgs<ExtArgs>
  }

  export type $ItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Item"
    objects: {
      category: Prisma.$CategoryPayload<ExtArgs>
      location: Prisma.$LocationPayload<ExtArgs> | null
      parent: Prisma.$ItemPayload<ExtArgs> | null
      children: Prisma.$ItemPayload<ExtArgs>[]
      logs: Prisma.$InventoryLogPayload<ExtArgs>[]
      borrowings: Prisma.$InventoryBorrowingPayload<ExtArgs>[]
      audits: Prisma.$ItemAuditPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      inventoryCode: string | null
      categoryId: string
      type: string
      stock: number
      minStock: number
      unit: string
      status: string
      statusDetails: string | null
      locationId: string | null
      aisle: string | null
      shelf: string | null
      bin: string | null
      assignedTo: string | null
      imageUrl: string | null
      isApprovalRequired: boolean
      isKit: boolean
      nextMaintenanceDate: Date | null
      parentId: string | null
      lastUpdated: Date
      createdAt: Date
    }, ExtArgs["result"]["item"]>
    composites: {}
  }

  type ItemGetPayload<S extends boolean | null | undefined | ItemDefaultArgs> = $Result.GetResult<Prisma.$ItemPayload, S>

  type ItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ItemCountAggregateInputType | true
    }

  export interface ItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Item'], meta: { name: 'Item' } }
    /**
     * Find zero or one Item that matches the filter.
     * @param {ItemFindUniqueArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ItemFindUniqueArgs>(args: SelectSubset<T, ItemFindUniqueArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Item that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ItemFindUniqueOrThrowArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ItemFindUniqueOrThrowArgs>(args: SelectSubset<T, ItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Item that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindFirstArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ItemFindFirstArgs>(args?: SelectSubset<T, ItemFindFirstArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Item that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindFirstOrThrowArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ItemFindFirstOrThrowArgs>(args?: SelectSubset<T, ItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Items that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Items
     * const items = await prisma.item.findMany()
     * 
     * // Get first 10 Items
     * const items = await prisma.item.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const itemWithIdOnly = await prisma.item.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ItemFindManyArgs>(args?: SelectSubset<T, ItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Item.
     * @param {ItemCreateArgs} args - Arguments to create a Item.
     * @example
     * // Create one Item
     * const Item = await prisma.item.create({
     *   data: {
     *     // ... data to create a Item
     *   }
     * })
     * 
     */
    create<T extends ItemCreateArgs>(args: SelectSubset<T, ItemCreateArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Items.
     * @param {ItemCreateManyArgs} args - Arguments to create many Items.
     * @example
     * // Create many Items
     * const item = await prisma.item.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ItemCreateManyArgs>(args?: SelectSubset<T, ItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Items and returns the data saved in the database.
     * @param {ItemCreateManyAndReturnArgs} args - Arguments to create many Items.
     * @example
     * // Create many Items
     * const item = await prisma.item.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Items and only return the `id`
     * const itemWithIdOnly = await prisma.item.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ItemCreateManyAndReturnArgs>(args?: SelectSubset<T, ItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Item.
     * @param {ItemDeleteArgs} args - Arguments to delete one Item.
     * @example
     * // Delete one Item
     * const Item = await prisma.item.delete({
     *   where: {
     *     // ... filter to delete one Item
     *   }
     * })
     * 
     */
    delete<T extends ItemDeleteArgs>(args: SelectSubset<T, ItemDeleteArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Item.
     * @param {ItemUpdateArgs} args - Arguments to update one Item.
     * @example
     * // Update one Item
     * const item = await prisma.item.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ItemUpdateArgs>(args: SelectSubset<T, ItemUpdateArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Items.
     * @param {ItemDeleteManyArgs} args - Arguments to filter Items to delete.
     * @example
     * // Delete a few Items
     * const { count } = await prisma.item.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ItemDeleteManyArgs>(args?: SelectSubset<T, ItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Items.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Items
     * const item = await prisma.item.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ItemUpdateManyArgs>(args: SelectSubset<T, ItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Item.
     * @param {ItemUpsertArgs} args - Arguments to update or create a Item.
     * @example
     * // Update or create a Item
     * const item = await prisma.item.upsert({
     *   create: {
     *     // ... data to create a Item
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Item we want to update
     *   }
     * })
     */
    upsert<T extends ItemUpsertArgs>(args: SelectSubset<T, ItemUpsertArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Items.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCountArgs} args - Arguments to filter Items to count.
     * @example
     * // Count the number of Items
     * const count = await prisma.item.count({
     *   where: {
     *     // ... the filter for the Items we want to count
     *   }
     * })
    **/
    count<T extends ItemCountArgs>(
      args?: Subset<T, ItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Item.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ItemAggregateArgs>(args: Subset<T, ItemAggregateArgs>): Prisma.PrismaPromise<GetItemAggregateType<T>>

    /**
     * Group by Item.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ItemGroupByArgs['orderBy'] }
        : { orderBy?: ItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Item model
   */
  readonly fields: ItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Item.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    category<T extends CategoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CategoryDefaultArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    location<T extends Item$locationArgs<ExtArgs> = {}>(args?: Subset<T, Item$locationArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    parent<T extends Item$parentArgs<ExtArgs> = {}>(args?: Subset<T, Item$parentArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    children<T extends Item$childrenArgs<ExtArgs> = {}>(args?: Subset<T, Item$childrenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany"> | Null>
    logs<T extends Item$logsArgs<ExtArgs> = {}>(args?: Subset<T, Item$logsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "findMany"> | Null>
    borrowings<T extends Item$borrowingsArgs<ExtArgs> = {}>(args?: Subset<T, Item$borrowingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "findMany"> | Null>
    audits<T extends Item$auditsArgs<ExtArgs> = {}>(args?: Subset<T, Item$auditsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Item model
   */ 
  interface ItemFieldRefs {
    readonly id: FieldRef<"Item", 'String'>
    readonly name: FieldRef<"Item", 'String'>
    readonly inventoryCode: FieldRef<"Item", 'String'>
    readonly categoryId: FieldRef<"Item", 'String'>
    readonly type: FieldRef<"Item", 'String'>
    readonly stock: FieldRef<"Item", 'Int'>
    readonly minStock: FieldRef<"Item", 'Int'>
    readonly unit: FieldRef<"Item", 'String'>
    readonly status: FieldRef<"Item", 'String'>
    readonly statusDetails: FieldRef<"Item", 'String'>
    readonly locationId: FieldRef<"Item", 'String'>
    readonly aisle: FieldRef<"Item", 'String'>
    readonly shelf: FieldRef<"Item", 'String'>
    readonly bin: FieldRef<"Item", 'String'>
    readonly assignedTo: FieldRef<"Item", 'String'>
    readonly imageUrl: FieldRef<"Item", 'String'>
    readonly isApprovalRequired: FieldRef<"Item", 'Boolean'>
    readonly isKit: FieldRef<"Item", 'Boolean'>
    readonly nextMaintenanceDate: FieldRef<"Item", 'DateTime'>
    readonly parentId: FieldRef<"Item", 'String'>
    readonly lastUpdated: FieldRef<"Item", 'DateTime'>
    readonly createdAt: FieldRef<"Item", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Item findUnique
   */
  export type ItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item findUniqueOrThrow
   */
  export type ItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item findFirst
   */
  export type ItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Items.
     */
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item findFirstOrThrow
   */
  export type ItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Items.
     */
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item findMany
   */
  export type ItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Items to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item create
   */
  export type ItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The data needed to create a Item.
     */
    data: XOR<ItemCreateInput, ItemUncheckedCreateInput>
  }

  /**
   * Item createMany
   */
  export type ItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Items.
     */
    data: ItemCreateManyInput | ItemCreateManyInput[]
  }

  /**
   * Item createManyAndReturn
   */
  export type ItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Items.
     */
    data: ItemCreateManyInput | ItemCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Item update
   */
  export type ItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The data needed to update a Item.
     */
    data: XOR<ItemUpdateInput, ItemUncheckedUpdateInput>
    /**
     * Choose, which Item to update.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item updateMany
   */
  export type ItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Items.
     */
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyInput>
    /**
     * Filter which Items to update
     */
    where?: ItemWhereInput
  }

  /**
   * Item upsert
   */
  export type ItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The filter to search for the Item to update in case it exists.
     */
    where: ItemWhereUniqueInput
    /**
     * In case the Item found by the `where` argument doesn't exist, create a new Item with this data.
     */
    create: XOR<ItemCreateInput, ItemUncheckedCreateInput>
    /**
     * In case the Item was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ItemUpdateInput, ItemUncheckedUpdateInput>
  }

  /**
   * Item delete
   */
  export type ItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter which Item to delete.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item deleteMany
   */
  export type ItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Items to delete
     */
    where?: ItemWhereInput
  }

  /**
   * Item.location
   */
  export type Item$locationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
  }

  /**
   * Item.parent
   */
  export type Item$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
  }

  /**
   * Item.children
   */
  export type Item$childrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    cursor?: ItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item.logs
   */
  export type Item$logsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    where?: InventoryLogWhereInput
    orderBy?: InventoryLogOrderByWithRelationInput | InventoryLogOrderByWithRelationInput[]
    cursor?: InventoryLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InventoryLogScalarFieldEnum | InventoryLogScalarFieldEnum[]
  }

  /**
   * Item.borrowings
   */
  export type Item$borrowingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    where?: InventoryBorrowingWhereInput
    orderBy?: InventoryBorrowingOrderByWithRelationInput | InventoryBorrowingOrderByWithRelationInput[]
    cursor?: InventoryBorrowingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InventoryBorrowingScalarFieldEnum | InventoryBorrowingScalarFieldEnum[]
  }

  /**
   * Item.audits
   */
  export type Item$auditsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    where?: ItemAuditWhereInput
    orderBy?: ItemAuditOrderByWithRelationInput | ItemAuditOrderByWithRelationInput[]
    cursor?: ItemAuditWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemAuditScalarFieldEnum | ItemAuditScalarFieldEnum[]
  }

  /**
   * Item without action
   */
  export type ItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
  }


  /**
   * Model InventoryLog
   */

  export type AggregateInventoryLog = {
    _count: InventoryLogCountAggregateOutputType | null
    _avg: InventoryLogAvgAggregateOutputType | null
    _sum: InventoryLogSumAggregateOutputType | null
    _min: InventoryLogMinAggregateOutputType | null
    _max: InventoryLogMaxAggregateOutputType | null
  }

  export type InventoryLogAvgAggregateOutputType = {
    quantity: number | null
    balance: number | null
  }

  export type InventoryLogSumAggregateOutputType = {
    quantity: number | null
    balance: number | null
  }

  export type InventoryLogMinAggregateOutputType = {
    id: string | null
    itemId: string | null
    workerId: string | null
    action: string | null
    quantity: number | null
    balance: number | null
    notes: string | null
    timestamp: Date | null
  }

  export type InventoryLogMaxAggregateOutputType = {
    id: string | null
    itemId: string | null
    workerId: string | null
    action: string | null
    quantity: number | null
    balance: number | null
    notes: string | null
    timestamp: Date | null
  }

  export type InventoryLogCountAggregateOutputType = {
    id: number
    itemId: number
    workerId: number
    action: number
    quantity: number
    balance: number
    notes: number
    timestamp: number
    _all: number
  }


  export type InventoryLogAvgAggregateInputType = {
    quantity?: true
    balance?: true
  }

  export type InventoryLogSumAggregateInputType = {
    quantity?: true
    balance?: true
  }

  export type InventoryLogMinAggregateInputType = {
    id?: true
    itemId?: true
    workerId?: true
    action?: true
    quantity?: true
    balance?: true
    notes?: true
    timestamp?: true
  }

  export type InventoryLogMaxAggregateInputType = {
    id?: true
    itemId?: true
    workerId?: true
    action?: true
    quantity?: true
    balance?: true
    notes?: true
    timestamp?: true
  }

  export type InventoryLogCountAggregateInputType = {
    id?: true
    itemId?: true
    workerId?: true
    action?: true
    quantity?: true
    balance?: true
    notes?: true
    timestamp?: true
    _all?: true
  }

  export type InventoryLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryLog to aggregate.
     */
    where?: InventoryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryLogs to fetch.
     */
    orderBy?: InventoryLogOrderByWithRelationInput | InventoryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InventoryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InventoryLogs
    **/
    _count?: true | InventoryLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InventoryLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InventoryLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InventoryLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InventoryLogMaxAggregateInputType
  }

  export type GetInventoryLogAggregateType<T extends InventoryLogAggregateArgs> = {
        [P in keyof T & keyof AggregateInventoryLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryLog[P]>
      : GetScalarType<T[P], AggregateInventoryLog[P]>
  }




  export type InventoryLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryLogWhereInput
    orderBy?: InventoryLogOrderByWithAggregationInput | InventoryLogOrderByWithAggregationInput[]
    by: InventoryLogScalarFieldEnum[] | InventoryLogScalarFieldEnum
    having?: InventoryLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InventoryLogCountAggregateInputType | true
    _avg?: InventoryLogAvgAggregateInputType
    _sum?: InventoryLogSumAggregateInputType
    _min?: InventoryLogMinAggregateInputType
    _max?: InventoryLogMaxAggregateInputType
  }

  export type InventoryLogGroupByOutputType = {
    id: string
    itemId: string
    workerId: string | null
    action: string
    quantity: number
    balance: number
    notes: string | null
    timestamp: Date
    _count: InventoryLogCountAggregateOutputType | null
    _avg: InventoryLogAvgAggregateOutputType | null
    _sum: InventoryLogSumAggregateOutputType | null
    _min: InventoryLogMinAggregateOutputType | null
    _max: InventoryLogMaxAggregateOutputType | null
  }

  type GetInventoryLogGroupByPayload<T extends InventoryLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InventoryLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryLogGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryLogGroupByOutputType[P]>
        }
      >
    >


  export type InventoryLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    workerId?: boolean
    action?: boolean
    quantity?: boolean
    balance?: boolean
    notes?: boolean
    timestamp?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryLog"]>

  export type InventoryLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    workerId?: boolean
    action?: boolean
    quantity?: boolean
    balance?: boolean
    notes?: boolean
    timestamp?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryLog"]>

  export type InventoryLogSelectScalar = {
    id?: boolean
    itemId?: boolean
    workerId?: boolean
    action?: boolean
    quantity?: boolean
    balance?: boolean
    notes?: boolean
    timestamp?: boolean
  }

  export type InventoryLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type InventoryLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }

  export type $InventoryLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InventoryLog"
    objects: {
      item: Prisma.$ItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      itemId: string
      workerId: string | null
      action: string
      quantity: number
      balance: number
      notes: string | null
      timestamp: Date
    }, ExtArgs["result"]["inventoryLog"]>
    composites: {}
  }

  type InventoryLogGetPayload<S extends boolean | null | undefined | InventoryLogDefaultArgs> = $Result.GetResult<Prisma.$InventoryLogPayload, S>

  type InventoryLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<InventoryLogFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: InventoryLogCountAggregateInputType | true
    }

  export interface InventoryLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InventoryLog'], meta: { name: 'InventoryLog' } }
    /**
     * Find zero or one InventoryLog that matches the filter.
     * @param {InventoryLogFindUniqueArgs} args - Arguments to find a InventoryLog
     * @example
     * // Get one InventoryLog
     * const inventoryLog = await prisma.inventoryLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryLogFindUniqueArgs>(args: SelectSubset<T, InventoryLogFindUniqueArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one InventoryLog that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {InventoryLogFindUniqueOrThrowArgs} args - Arguments to find a InventoryLog
     * @example
     * // Get one InventoryLog
     * const inventoryLog = await prisma.inventoryLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryLogFindUniqueOrThrowArgs>(args: SelectSubset<T, InventoryLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first InventoryLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLogFindFirstArgs} args - Arguments to find a InventoryLog
     * @example
     * // Get one InventoryLog
     * const inventoryLog = await prisma.inventoryLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryLogFindFirstArgs>(args?: SelectSubset<T, InventoryLogFindFirstArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first InventoryLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLogFindFirstOrThrowArgs} args - Arguments to find a InventoryLog
     * @example
     * // Get one InventoryLog
     * const inventoryLog = await prisma.inventoryLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryLogFindFirstOrThrowArgs>(args?: SelectSubset<T, InventoryLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more InventoryLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryLogs
     * const inventoryLogs = await prisma.inventoryLog.findMany()
     * 
     * // Get first 10 InventoryLogs
     * const inventoryLogs = await prisma.inventoryLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inventoryLogWithIdOnly = await prisma.inventoryLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InventoryLogFindManyArgs>(args?: SelectSubset<T, InventoryLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a InventoryLog.
     * @param {InventoryLogCreateArgs} args - Arguments to create a InventoryLog.
     * @example
     * // Create one InventoryLog
     * const InventoryLog = await prisma.inventoryLog.create({
     *   data: {
     *     // ... data to create a InventoryLog
     *   }
     * })
     * 
     */
    create<T extends InventoryLogCreateArgs>(args: SelectSubset<T, InventoryLogCreateArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many InventoryLogs.
     * @param {InventoryLogCreateManyArgs} args - Arguments to create many InventoryLogs.
     * @example
     * // Create many InventoryLogs
     * const inventoryLog = await prisma.inventoryLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InventoryLogCreateManyArgs>(args?: SelectSubset<T, InventoryLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InventoryLogs and returns the data saved in the database.
     * @param {InventoryLogCreateManyAndReturnArgs} args - Arguments to create many InventoryLogs.
     * @example
     * // Create many InventoryLogs
     * const inventoryLog = await prisma.inventoryLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InventoryLogs and only return the `id`
     * const inventoryLogWithIdOnly = await prisma.inventoryLog.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InventoryLogCreateManyAndReturnArgs>(args?: SelectSubset<T, InventoryLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a InventoryLog.
     * @param {InventoryLogDeleteArgs} args - Arguments to delete one InventoryLog.
     * @example
     * // Delete one InventoryLog
     * const InventoryLog = await prisma.inventoryLog.delete({
     *   where: {
     *     // ... filter to delete one InventoryLog
     *   }
     * })
     * 
     */
    delete<T extends InventoryLogDeleteArgs>(args: SelectSubset<T, InventoryLogDeleteArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one InventoryLog.
     * @param {InventoryLogUpdateArgs} args - Arguments to update one InventoryLog.
     * @example
     * // Update one InventoryLog
     * const inventoryLog = await prisma.inventoryLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InventoryLogUpdateArgs>(args: SelectSubset<T, InventoryLogUpdateArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more InventoryLogs.
     * @param {InventoryLogDeleteManyArgs} args - Arguments to filter InventoryLogs to delete.
     * @example
     * // Delete a few InventoryLogs
     * const { count } = await prisma.inventoryLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InventoryLogDeleteManyArgs>(args?: SelectSubset<T, InventoryLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryLogs
     * const inventoryLog = await prisma.inventoryLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InventoryLogUpdateManyArgs>(args: SelectSubset<T, InventoryLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one InventoryLog.
     * @param {InventoryLogUpsertArgs} args - Arguments to update or create a InventoryLog.
     * @example
     * // Update or create a InventoryLog
     * const inventoryLog = await prisma.inventoryLog.upsert({
     *   create: {
     *     // ... data to create a InventoryLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryLog we want to update
     *   }
     * })
     */
    upsert<T extends InventoryLogUpsertArgs>(args: SelectSubset<T, InventoryLogUpsertArgs<ExtArgs>>): Prisma__InventoryLogClient<$Result.GetResult<Prisma.$InventoryLogPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of InventoryLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLogCountArgs} args - Arguments to filter InventoryLogs to count.
     * @example
     * // Count the number of InventoryLogs
     * const count = await prisma.inventoryLog.count({
     *   where: {
     *     // ... the filter for the InventoryLogs we want to count
     *   }
     * })
    **/
    count<T extends InventoryLogCountArgs>(
      args?: Subset<T, InventoryLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InventoryLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InventoryLogAggregateArgs>(args: Subset<T, InventoryLogAggregateArgs>): Prisma.PrismaPromise<GetInventoryLogAggregateType<T>>

    /**
     * Group by InventoryLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InventoryLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryLogGroupByArgs['orderBy'] }
        : { orderBy?: InventoryLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InventoryLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInventoryLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InventoryLog model
   */
  readonly fields: InventoryLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    item<T extends ItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ItemDefaultArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the InventoryLog model
   */ 
  interface InventoryLogFieldRefs {
    readonly id: FieldRef<"InventoryLog", 'String'>
    readonly itemId: FieldRef<"InventoryLog", 'String'>
    readonly workerId: FieldRef<"InventoryLog", 'String'>
    readonly action: FieldRef<"InventoryLog", 'String'>
    readonly quantity: FieldRef<"InventoryLog", 'Int'>
    readonly balance: FieldRef<"InventoryLog", 'Int'>
    readonly notes: FieldRef<"InventoryLog", 'String'>
    readonly timestamp: FieldRef<"InventoryLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * InventoryLog findUnique
   */
  export type InventoryLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * Filter, which InventoryLog to fetch.
     */
    where: InventoryLogWhereUniqueInput
  }

  /**
   * InventoryLog findUniqueOrThrow
   */
  export type InventoryLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * Filter, which InventoryLog to fetch.
     */
    where: InventoryLogWhereUniqueInput
  }

  /**
   * InventoryLog findFirst
   */
  export type InventoryLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * Filter, which InventoryLog to fetch.
     */
    where?: InventoryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryLogs to fetch.
     */
    orderBy?: InventoryLogOrderByWithRelationInput | InventoryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryLogs.
     */
    cursor?: InventoryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryLogs.
     */
    distinct?: InventoryLogScalarFieldEnum | InventoryLogScalarFieldEnum[]
  }

  /**
   * InventoryLog findFirstOrThrow
   */
  export type InventoryLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * Filter, which InventoryLog to fetch.
     */
    where?: InventoryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryLogs to fetch.
     */
    orderBy?: InventoryLogOrderByWithRelationInput | InventoryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryLogs.
     */
    cursor?: InventoryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryLogs.
     */
    distinct?: InventoryLogScalarFieldEnum | InventoryLogScalarFieldEnum[]
  }

  /**
   * InventoryLog findMany
   */
  export type InventoryLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * Filter, which InventoryLogs to fetch.
     */
    where?: InventoryLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryLogs to fetch.
     */
    orderBy?: InventoryLogOrderByWithRelationInput | InventoryLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InventoryLogs.
     */
    cursor?: InventoryLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryLogs.
     */
    skip?: number
    distinct?: InventoryLogScalarFieldEnum | InventoryLogScalarFieldEnum[]
  }

  /**
   * InventoryLog create
   */
  export type InventoryLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * The data needed to create a InventoryLog.
     */
    data: XOR<InventoryLogCreateInput, InventoryLogUncheckedCreateInput>
  }

  /**
   * InventoryLog createMany
   */
  export type InventoryLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InventoryLogs.
     */
    data: InventoryLogCreateManyInput | InventoryLogCreateManyInput[]
  }

  /**
   * InventoryLog createManyAndReturn
   */
  export type InventoryLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many InventoryLogs.
     */
    data: InventoryLogCreateManyInput | InventoryLogCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * InventoryLog update
   */
  export type InventoryLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * The data needed to update a InventoryLog.
     */
    data: XOR<InventoryLogUpdateInput, InventoryLogUncheckedUpdateInput>
    /**
     * Choose, which InventoryLog to update.
     */
    where: InventoryLogWhereUniqueInput
  }

  /**
   * InventoryLog updateMany
   */
  export type InventoryLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InventoryLogs.
     */
    data: XOR<InventoryLogUpdateManyMutationInput, InventoryLogUncheckedUpdateManyInput>
    /**
     * Filter which InventoryLogs to update
     */
    where?: InventoryLogWhereInput
  }

  /**
   * InventoryLog upsert
   */
  export type InventoryLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * The filter to search for the InventoryLog to update in case it exists.
     */
    where: InventoryLogWhereUniqueInput
    /**
     * In case the InventoryLog found by the `where` argument doesn't exist, create a new InventoryLog with this data.
     */
    create: XOR<InventoryLogCreateInput, InventoryLogUncheckedCreateInput>
    /**
     * In case the InventoryLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryLogUpdateInput, InventoryLogUncheckedUpdateInput>
  }

  /**
   * InventoryLog delete
   */
  export type InventoryLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
    /**
     * Filter which InventoryLog to delete.
     */
    where: InventoryLogWhereUniqueInput
  }

  /**
   * InventoryLog deleteMany
   */
  export type InventoryLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryLogs to delete
     */
    where?: InventoryLogWhereInput
  }

  /**
   * InventoryLog without action
   */
  export type InventoryLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryLog
     */
    select?: InventoryLogSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLogInclude<ExtArgs> | null
  }


  /**
   * Model InventoryBorrowing
   */

  export type AggregateInventoryBorrowing = {
    _count: InventoryBorrowingCountAggregateOutputType | null
    _avg: InventoryBorrowingAvgAggregateOutputType | null
    _sum: InventoryBorrowingSumAggregateOutputType | null
    _min: InventoryBorrowingMinAggregateOutputType | null
    _max: InventoryBorrowingMaxAggregateOutputType | null
  }

  export type InventoryBorrowingAvgAggregateOutputType = {
    quantity: number | null
  }

  export type InventoryBorrowingSumAggregateOutputType = {
    quantity: number | null
  }

  export type InventoryBorrowingMinAggregateOutputType = {
    id: string | null
    itemId: string | null
    quantity: number | null
    borrowerId: string | null
    borrowerName: string | null
    borrowerEmail: string | null
    borrowedAt: Date | null
    dueDate: Date | null
    returnedAt: Date | null
    status: string | null
    checkoutNotes: string | null
    checkoutCondition: string | null
    checkoutChecklist: string | null
    returnNotes: string | null
    returnCondition: string | null
    returnChecklist: string | null
    returnPhotos: string | null
  }

  export type InventoryBorrowingMaxAggregateOutputType = {
    id: string | null
    itemId: string | null
    quantity: number | null
    borrowerId: string | null
    borrowerName: string | null
    borrowerEmail: string | null
    borrowedAt: Date | null
    dueDate: Date | null
    returnedAt: Date | null
    status: string | null
    checkoutNotes: string | null
    checkoutCondition: string | null
    checkoutChecklist: string | null
    returnNotes: string | null
    returnCondition: string | null
    returnChecklist: string | null
    returnPhotos: string | null
  }

  export type InventoryBorrowingCountAggregateOutputType = {
    id: number
    itemId: number
    quantity: number
    borrowerId: number
    borrowerName: number
    borrowerEmail: number
    borrowedAt: number
    dueDate: number
    returnedAt: number
    status: number
    checkoutNotes: number
    checkoutCondition: number
    checkoutChecklist: number
    returnNotes: number
    returnCondition: number
    returnChecklist: number
    returnPhotos: number
    _all: number
  }


  export type InventoryBorrowingAvgAggregateInputType = {
    quantity?: true
  }

  export type InventoryBorrowingSumAggregateInputType = {
    quantity?: true
  }

  export type InventoryBorrowingMinAggregateInputType = {
    id?: true
    itemId?: true
    quantity?: true
    borrowerId?: true
    borrowerName?: true
    borrowerEmail?: true
    borrowedAt?: true
    dueDate?: true
    returnedAt?: true
    status?: true
    checkoutNotes?: true
    checkoutCondition?: true
    checkoutChecklist?: true
    returnNotes?: true
    returnCondition?: true
    returnChecklist?: true
    returnPhotos?: true
  }

  export type InventoryBorrowingMaxAggregateInputType = {
    id?: true
    itemId?: true
    quantity?: true
    borrowerId?: true
    borrowerName?: true
    borrowerEmail?: true
    borrowedAt?: true
    dueDate?: true
    returnedAt?: true
    status?: true
    checkoutNotes?: true
    checkoutCondition?: true
    checkoutChecklist?: true
    returnNotes?: true
    returnCondition?: true
    returnChecklist?: true
    returnPhotos?: true
  }

  export type InventoryBorrowingCountAggregateInputType = {
    id?: true
    itemId?: true
    quantity?: true
    borrowerId?: true
    borrowerName?: true
    borrowerEmail?: true
    borrowedAt?: true
    dueDate?: true
    returnedAt?: true
    status?: true
    checkoutNotes?: true
    checkoutCondition?: true
    checkoutChecklist?: true
    returnNotes?: true
    returnCondition?: true
    returnChecklist?: true
    returnPhotos?: true
    _all?: true
  }

  export type InventoryBorrowingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryBorrowing to aggregate.
     */
    where?: InventoryBorrowingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBorrowings to fetch.
     */
    orderBy?: InventoryBorrowingOrderByWithRelationInput | InventoryBorrowingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InventoryBorrowingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBorrowings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBorrowings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InventoryBorrowings
    **/
    _count?: true | InventoryBorrowingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InventoryBorrowingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InventoryBorrowingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InventoryBorrowingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InventoryBorrowingMaxAggregateInputType
  }

  export type GetInventoryBorrowingAggregateType<T extends InventoryBorrowingAggregateArgs> = {
        [P in keyof T & keyof AggregateInventoryBorrowing]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryBorrowing[P]>
      : GetScalarType<T[P], AggregateInventoryBorrowing[P]>
  }




  export type InventoryBorrowingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryBorrowingWhereInput
    orderBy?: InventoryBorrowingOrderByWithAggregationInput | InventoryBorrowingOrderByWithAggregationInput[]
    by: InventoryBorrowingScalarFieldEnum[] | InventoryBorrowingScalarFieldEnum
    having?: InventoryBorrowingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InventoryBorrowingCountAggregateInputType | true
    _avg?: InventoryBorrowingAvgAggregateInputType
    _sum?: InventoryBorrowingSumAggregateInputType
    _min?: InventoryBorrowingMinAggregateInputType
    _max?: InventoryBorrowingMaxAggregateInputType
  }

  export type InventoryBorrowingGroupByOutputType = {
    id: string
    itemId: string
    quantity: number
    borrowerId: string
    borrowerName: string
    borrowerEmail: string | null
    borrowedAt: Date
    dueDate: Date | null
    returnedAt: Date | null
    status: string
    checkoutNotes: string | null
    checkoutCondition: string | null
    checkoutChecklist: string | null
    returnNotes: string | null
    returnCondition: string | null
    returnChecklist: string | null
    returnPhotos: string | null
    _count: InventoryBorrowingCountAggregateOutputType | null
    _avg: InventoryBorrowingAvgAggregateOutputType | null
    _sum: InventoryBorrowingSumAggregateOutputType | null
    _min: InventoryBorrowingMinAggregateOutputType | null
    _max: InventoryBorrowingMaxAggregateOutputType | null
  }

  type GetInventoryBorrowingGroupByPayload<T extends InventoryBorrowingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryBorrowingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InventoryBorrowingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryBorrowingGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryBorrowingGroupByOutputType[P]>
        }
      >
    >


  export type InventoryBorrowingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    quantity?: boolean
    borrowerId?: boolean
    borrowerName?: boolean
    borrowerEmail?: boolean
    borrowedAt?: boolean
    dueDate?: boolean
    returnedAt?: boolean
    status?: boolean
    checkoutNotes?: boolean
    checkoutCondition?: boolean
    checkoutChecklist?: boolean
    returnNotes?: boolean
    returnCondition?: boolean
    returnChecklist?: boolean
    returnPhotos?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryBorrowing"]>

  export type InventoryBorrowingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    quantity?: boolean
    borrowerId?: boolean
    borrowerName?: boolean
    borrowerEmail?: boolean
    borrowedAt?: boolean
    dueDate?: boolean
    returnedAt?: boolean
    status?: boolean
    checkoutNotes?: boolean
    checkoutCondition?: boolean
    checkoutChecklist?: boolean
    returnNotes?: boolean
    returnCondition?: boolean
    returnChecklist?: boolean
    returnPhotos?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryBorrowing"]>

  export type InventoryBorrowingSelectScalar = {
    id?: boolean
    itemId?: boolean
    quantity?: boolean
    borrowerId?: boolean
    borrowerName?: boolean
    borrowerEmail?: boolean
    borrowedAt?: boolean
    dueDate?: boolean
    returnedAt?: boolean
    status?: boolean
    checkoutNotes?: boolean
    checkoutCondition?: boolean
    checkoutChecklist?: boolean
    returnNotes?: boolean
    returnCondition?: boolean
    returnChecklist?: boolean
    returnPhotos?: boolean
  }

  export type InventoryBorrowingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type InventoryBorrowingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }

  export type $InventoryBorrowingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InventoryBorrowing"
    objects: {
      item: Prisma.$ItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      itemId: string
      quantity: number
      borrowerId: string
      borrowerName: string
      borrowerEmail: string | null
      borrowedAt: Date
      dueDate: Date | null
      returnedAt: Date | null
      status: string
      checkoutNotes: string | null
      checkoutCondition: string | null
      checkoutChecklist: string | null
      returnNotes: string | null
      returnCondition: string | null
      returnChecklist: string | null
      returnPhotos: string | null
    }, ExtArgs["result"]["inventoryBorrowing"]>
    composites: {}
  }

  type InventoryBorrowingGetPayload<S extends boolean | null | undefined | InventoryBorrowingDefaultArgs> = $Result.GetResult<Prisma.$InventoryBorrowingPayload, S>

  type InventoryBorrowingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<InventoryBorrowingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: InventoryBorrowingCountAggregateInputType | true
    }

  export interface InventoryBorrowingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InventoryBorrowing'], meta: { name: 'InventoryBorrowing' } }
    /**
     * Find zero or one InventoryBorrowing that matches the filter.
     * @param {InventoryBorrowingFindUniqueArgs} args - Arguments to find a InventoryBorrowing
     * @example
     * // Get one InventoryBorrowing
     * const inventoryBorrowing = await prisma.inventoryBorrowing.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryBorrowingFindUniqueArgs>(args: SelectSubset<T, InventoryBorrowingFindUniqueArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one InventoryBorrowing that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {InventoryBorrowingFindUniqueOrThrowArgs} args - Arguments to find a InventoryBorrowing
     * @example
     * // Get one InventoryBorrowing
     * const inventoryBorrowing = await prisma.inventoryBorrowing.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryBorrowingFindUniqueOrThrowArgs>(args: SelectSubset<T, InventoryBorrowingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first InventoryBorrowing that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBorrowingFindFirstArgs} args - Arguments to find a InventoryBorrowing
     * @example
     * // Get one InventoryBorrowing
     * const inventoryBorrowing = await prisma.inventoryBorrowing.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryBorrowingFindFirstArgs>(args?: SelectSubset<T, InventoryBorrowingFindFirstArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first InventoryBorrowing that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBorrowingFindFirstOrThrowArgs} args - Arguments to find a InventoryBorrowing
     * @example
     * // Get one InventoryBorrowing
     * const inventoryBorrowing = await prisma.inventoryBorrowing.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryBorrowingFindFirstOrThrowArgs>(args?: SelectSubset<T, InventoryBorrowingFindFirstOrThrowArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more InventoryBorrowings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBorrowingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryBorrowings
     * const inventoryBorrowings = await prisma.inventoryBorrowing.findMany()
     * 
     * // Get first 10 InventoryBorrowings
     * const inventoryBorrowings = await prisma.inventoryBorrowing.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inventoryBorrowingWithIdOnly = await prisma.inventoryBorrowing.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InventoryBorrowingFindManyArgs>(args?: SelectSubset<T, InventoryBorrowingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a InventoryBorrowing.
     * @param {InventoryBorrowingCreateArgs} args - Arguments to create a InventoryBorrowing.
     * @example
     * // Create one InventoryBorrowing
     * const InventoryBorrowing = await prisma.inventoryBorrowing.create({
     *   data: {
     *     // ... data to create a InventoryBorrowing
     *   }
     * })
     * 
     */
    create<T extends InventoryBorrowingCreateArgs>(args: SelectSubset<T, InventoryBorrowingCreateArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many InventoryBorrowings.
     * @param {InventoryBorrowingCreateManyArgs} args - Arguments to create many InventoryBorrowings.
     * @example
     * // Create many InventoryBorrowings
     * const inventoryBorrowing = await prisma.inventoryBorrowing.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InventoryBorrowingCreateManyArgs>(args?: SelectSubset<T, InventoryBorrowingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InventoryBorrowings and returns the data saved in the database.
     * @param {InventoryBorrowingCreateManyAndReturnArgs} args - Arguments to create many InventoryBorrowings.
     * @example
     * // Create many InventoryBorrowings
     * const inventoryBorrowing = await prisma.inventoryBorrowing.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InventoryBorrowings and only return the `id`
     * const inventoryBorrowingWithIdOnly = await prisma.inventoryBorrowing.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InventoryBorrowingCreateManyAndReturnArgs>(args?: SelectSubset<T, InventoryBorrowingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a InventoryBorrowing.
     * @param {InventoryBorrowingDeleteArgs} args - Arguments to delete one InventoryBorrowing.
     * @example
     * // Delete one InventoryBorrowing
     * const InventoryBorrowing = await prisma.inventoryBorrowing.delete({
     *   where: {
     *     // ... filter to delete one InventoryBorrowing
     *   }
     * })
     * 
     */
    delete<T extends InventoryBorrowingDeleteArgs>(args: SelectSubset<T, InventoryBorrowingDeleteArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one InventoryBorrowing.
     * @param {InventoryBorrowingUpdateArgs} args - Arguments to update one InventoryBorrowing.
     * @example
     * // Update one InventoryBorrowing
     * const inventoryBorrowing = await prisma.inventoryBorrowing.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InventoryBorrowingUpdateArgs>(args: SelectSubset<T, InventoryBorrowingUpdateArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more InventoryBorrowings.
     * @param {InventoryBorrowingDeleteManyArgs} args - Arguments to filter InventoryBorrowings to delete.
     * @example
     * // Delete a few InventoryBorrowings
     * const { count } = await prisma.inventoryBorrowing.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InventoryBorrowingDeleteManyArgs>(args?: SelectSubset<T, InventoryBorrowingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryBorrowings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBorrowingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryBorrowings
     * const inventoryBorrowing = await prisma.inventoryBorrowing.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InventoryBorrowingUpdateManyArgs>(args: SelectSubset<T, InventoryBorrowingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one InventoryBorrowing.
     * @param {InventoryBorrowingUpsertArgs} args - Arguments to update or create a InventoryBorrowing.
     * @example
     * // Update or create a InventoryBorrowing
     * const inventoryBorrowing = await prisma.inventoryBorrowing.upsert({
     *   create: {
     *     // ... data to create a InventoryBorrowing
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryBorrowing we want to update
     *   }
     * })
     */
    upsert<T extends InventoryBorrowingUpsertArgs>(args: SelectSubset<T, InventoryBorrowingUpsertArgs<ExtArgs>>): Prisma__InventoryBorrowingClient<$Result.GetResult<Prisma.$InventoryBorrowingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of InventoryBorrowings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBorrowingCountArgs} args - Arguments to filter InventoryBorrowings to count.
     * @example
     * // Count the number of InventoryBorrowings
     * const count = await prisma.inventoryBorrowing.count({
     *   where: {
     *     // ... the filter for the InventoryBorrowings we want to count
     *   }
     * })
    **/
    count<T extends InventoryBorrowingCountArgs>(
      args?: Subset<T, InventoryBorrowingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryBorrowingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InventoryBorrowing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBorrowingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InventoryBorrowingAggregateArgs>(args: Subset<T, InventoryBorrowingAggregateArgs>): Prisma.PrismaPromise<GetInventoryBorrowingAggregateType<T>>

    /**
     * Group by InventoryBorrowing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBorrowingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InventoryBorrowingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryBorrowingGroupByArgs['orderBy'] }
        : { orderBy?: InventoryBorrowingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InventoryBorrowingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInventoryBorrowingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InventoryBorrowing model
   */
  readonly fields: InventoryBorrowingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryBorrowing.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryBorrowingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    item<T extends ItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ItemDefaultArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the InventoryBorrowing model
   */ 
  interface InventoryBorrowingFieldRefs {
    readonly id: FieldRef<"InventoryBorrowing", 'String'>
    readonly itemId: FieldRef<"InventoryBorrowing", 'String'>
    readonly quantity: FieldRef<"InventoryBorrowing", 'Int'>
    readonly borrowerId: FieldRef<"InventoryBorrowing", 'String'>
    readonly borrowerName: FieldRef<"InventoryBorrowing", 'String'>
    readonly borrowerEmail: FieldRef<"InventoryBorrowing", 'String'>
    readonly borrowedAt: FieldRef<"InventoryBorrowing", 'DateTime'>
    readonly dueDate: FieldRef<"InventoryBorrowing", 'DateTime'>
    readonly returnedAt: FieldRef<"InventoryBorrowing", 'DateTime'>
    readonly status: FieldRef<"InventoryBorrowing", 'String'>
    readonly checkoutNotes: FieldRef<"InventoryBorrowing", 'String'>
    readonly checkoutCondition: FieldRef<"InventoryBorrowing", 'String'>
    readonly checkoutChecklist: FieldRef<"InventoryBorrowing", 'String'>
    readonly returnNotes: FieldRef<"InventoryBorrowing", 'String'>
    readonly returnCondition: FieldRef<"InventoryBorrowing", 'String'>
    readonly returnChecklist: FieldRef<"InventoryBorrowing", 'String'>
    readonly returnPhotos: FieldRef<"InventoryBorrowing", 'String'>
  }
    

  // Custom InputTypes
  /**
   * InventoryBorrowing findUnique
   */
  export type InventoryBorrowingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * Filter, which InventoryBorrowing to fetch.
     */
    where: InventoryBorrowingWhereUniqueInput
  }

  /**
   * InventoryBorrowing findUniqueOrThrow
   */
  export type InventoryBorrowingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * Filter, which InventoryBorrowing to fetch.
     */
    where: InventoryBorrowingWhereUniqueInput
  }

  /**
   * InventoryBorrowing findFirst
   */
  export type InventoryBorrowingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * Filter, which InventoryBorrowing to fetch.
     */
    where?: InventoryBorrowingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBorrowings to fetch.
     */
    orderBy?: InventoryBorrowingOrderByWithRelationInput | InventoryBorrowingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryBorrowings.
     */
    cursor?: InventoryBorrowingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBorrowings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBorrowings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryBorrowings.
     */
    distinct?: InventoryBorrowingScalarFieldEnum | InventoryBorrowingScalarFieldEnum[]
  }

  /**
   * InventoryBorrowing findFirstOrThrow
   */
  export type InventoryBorrowingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * Filter, which InventoryBorrowing to fetch.
     */
    where?: InventoryBorrowingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBorrowings to fetch.
     */
    orderBy?: InventoryBorrowingOrderByWithRelationInput | InventoryBorrowingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryBorrowings.
     */
    cursor?: InventoryBorrowingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBorrowings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBorrowings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryBorrowings.
     */
    distinct?: InventoryBorrowingScalarFieldEnum | InventoryBorrowingScalarFieldEnum[]
  }

  /**
   * InventoryBorrowing findMany
   */
  export type InventoryBorrowingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * Filter, which InventoryBorrowings to fetch.
     */
    where?: InventoryBorrowingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBorrowings to fetch.
     */
    orderBy?: InventoryBorrowingOrderByWithRelationInput | InventoryBorrowingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InventoryBorrowings.
     */
    cursor?: InventoryBorrowingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBorrowings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBorrowings.
     */
    skip?: number
    distinct?: InventoryBorrowingScalarFieldEnum | InventoryBorrowingScalarFieldEnum[]
  }

  /**
   * InventoryBorrowing create
   */
  export type InventoryBorrowingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * The data needed to create a InventoryBorrowing.
     */
    data: XOR<InventoryBorrowingCreateInput, InventoryBorrowingUncheckedCreateInput>
  }

  /**
   * InventoryBorrowing createMany
   */
  export type InventoryBorrowingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InventoryBorrowings.
     */
    data: InventoryBorrowingCreateManyInput | InventoryBorrowingCreateManyInput[]
  }

  /**
   * InventoryBorrowing createManyAndReturn
   */
  export type InventoryBorrowingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many InventoryBorrowings.
     */
    data: InventoryBorrowingCreateManyInput | InventoryBorrowingCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * InventoryBorrowing update
   */
  export type InventoryBorrowingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * The data needed to update a InventoryBorrowing.
     */
    data: XOR<InventoryBorrowingUpdateInput, InventoryBorrowingUncheckedUpdateInput>
    /**
     * Choose, which InventoryBorrowing to update.
     */
    where: InventoryBorrowingWhereUniqueInput
  }

  /**
   * InventoryBorrowing updateMany
   */
  export type InventoryBorrowingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InventoryBorrowings.
     */
    data: XOR<InventoryBorrowingUpdateManyMutationInput, InventoryBorrowingUncheckedUpdateManyInput>
    /**
     * Filter which InventoryBorrowings to update
     */
    where?: InventoryBorrowingWhereInput
  }

  /**
   * InventoryBorrowing upsert
   */
  export type InventoryBorrowingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * The filter to search for the InventoryBorrowing to update in case it exists.
     */
    where: InventoryBorrowingWhereUniqueInput
    /**
     * In case the InventoryBorrowing found by the `where` argument doesn't exist, create a new InventoryBorrowing with this data.
     */
    create: XOR<InventoryBorrowingCreateInput, InventoryBorrowingUncheckedCreateInput>
    /**
     * In case the InventoryBorrowing was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryBorrowingUpdateInput, InventoryBorrowingUncheckedUpdateInput>
  }

  /**
   * InventoryBorrowing delete
   */
  export type InventoryBorrowingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
    /**
     * Filter which InventoryBorrowing to delete.
     */
    where: InventoryBorrowingWhereUniqueInput
  }

  /**
   * InventoryBorrowing deleteMany
   */
  export type InventoryBorrowingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryBorrowings to delete
     */
    where?: InventoryBorrowingWhereInput
  }

  /**
   * InventoryBorrowing without action
   */
  export type InventoryBorrowingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBorrowing
     */
    select?: InventoryBorrowingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryBorrowingInclude<ExtArgs> | null
  }


  /**
   * Model Setting
   */

  export type AggregateSetting = {
    _count: SettingCountAggregateOutputType | null
    _min: SettingMinAggregateOutputType | null
    _max: SettingMaxAggregateOutputType | null
  }

  export type SettingMinAggregateOutputType = {
    id: string | null
    data: string | null
  }

  export type SettingMaxAggregateOutputType = {
    id: string | null
    data: string | null
  }

  export type SettingCountAggregateOutputType = {
    id: number
    data: number
    _all: number
  }


  export type SettingMinAggregateInputType = {
    id?: true
    data?: true
  }

  export type SettingMaxAggregateInputType = {
    id?: true
    data?: true
  }

  export type SettingCountAggregateInputType = {
    id?: true
    data?: true
    _all?: true
  }

  export type SettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Setting to aggregate.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Settings
    **/
    _count?: true | SettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SettingMaxAggregateInputType
  }

  export type GetSettingAggregateType<T extends SettingAggregateArgs> = {
        [P in keyof T & keyof AggregateSetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSetting[P]>
      : GetScalarType<T[P], AggregateSetting[P]>
  }




  export type SettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SettingWhereInput
    orderBy?: SettingOrderByWithAggregationInput | SettingOrderByWithAggregationInput[]
    by: SettingScalarFieldEnum[] | SettingScalarFieldEnum
    having?: SettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SettingCountAggregateInputType | true
    _min?: SettingMinAggregateInputType
    _max?: SettingMaxAggregateInputType
  }

  export type SettingGroupByOutputType = {
    id: string
    data: string
    _count: SettingCountAggregateOutputType | null
    _min: SettingMinAggregateOutputType | null
    _max: SettingMaxAggregateOutputType | null
  }

  type GetSettingGroupByPayload<T extends SettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SettingGroupByOutputType[P]>
            : GetScalarType<T[P], SettingGroupByOutputType[P]>
        }
      >
    >


  export type SettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    data?: boolean
  }, ExtArgs["result"]["setting"]>

  export type SettingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    data?: boolean
  }, ExtArgs["result"]["setting"]>

  export type SettingSelectScalar = {
    id?: boolean
    data?: boolean
  }


  export type $SettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Setting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      data: string
    }, ExtArgs["result"]["setting"]>
    composites: {}
  }

  type SettingGetPayload<S extends boolean | null | undefined | SettingDefaultArgs> = $Result.GetResult<Prisma.$SettingPayload, S>

  type SettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SettingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SettingCountAggregateInputType | true
    }

  export interface SettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Setting'], meta: { name: 'Setting' } }
    /**
     * Find zero or one Setting that matches the filter.
     * @param {SettingFindUniqueArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SettingFindUniqueArgs>(args: SelectSubset<T, SettingFindUniqueArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Setting that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SettingFindUniqueOrThrowArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SettingFindUniqueOrThrowArgs>(args: SelectSubset<T, SettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Setting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingFindFirstArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SettingFindFirstArgs>(args?: SelectSubset<T, SettingFindFirstArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Setting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingFindFirstOrThrowArgs} args - Arguments to find a Setting
     * @example
     * // Get one Setting
     * const setting = await prisma.setting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SettingFindFirstOrThrowArgs>(args?: SelectSubset<T, SettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Settings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Settings
     * const settings = await prisma.setting.findMany()
     * 
     * // Get first 10 Settings
     * const settings = await prisma.setting.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const settingWithIdOnly = await prisma.setting.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SettingFindManyArgs>(args?: SelectSubset<T, SettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Setting.
     * @param {SettingCreateArgs} args - Arguments to create a Setting.
     * @example
     * // Create one Setting
     * const Setting = await prisma.setting.create({
     *   data: {
     *     // ... data to create a Setting
     *   }
     * })
     * 
     */
    create<T extends SettingCreateArgs>(args: SelectSubset<T, SettingCreateArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Settings.
     * @param {SettingCreateManyArgs} args - Arguments to create many Settings.
     * @example
     * // Create many Settings
     * const setting = await prisma.setting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SettingCreateManyArgs>(args?: SelectSubset<T, SettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Settings and returns the data saved in the database.
     * @param {SettingCreateManyAndReturnArgs} args - Arguments to create many Settings.
     * @example
     * // Create many Settings
     * const setting = await prisma.setting.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Settings and only return the `id`
     * const settingWithIdOnly = await prisma.setting.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SettingCreateManyAndReturnArgs>(args?: SelectSubset<T, SettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Setting.
     * @param {SettingDeleteArgs} args - Arguments to delete one Setting.
     * @example
     * // Delete one Setting
     * const Setting = await prisma.setting.delete({
     *   where: {
     *     // ... filter to delete one Setting
     *   }
     * })
     * 
     */
    delete<T extends SettingDeleteArgs>(args: SelectSubset<T, SettingDeleteArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Setting.
     * @param {SettingUpdateArgs} args - Arguments to update one Setting.
     * @example
     * // Update one Setting
     * const setting = await prisma.setting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SettingUpdateArgs>(args: SelectSubset<T, SettingUpdateArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Settings.
     * @param {SettingDeleteManyArgs} args - Arguments to filter Settings to delete.
     * @example
     * // Delete a few Settings
     * const { count } = await prisma.setting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SettingDeleteManyArgs>(args?: SelectSubset<T, SettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Settings
     * const setting = await prisma.setting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SettingUpdateManyArgs>(args: SelectSubset<T, SettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Setting.
     * @param {SettingUpsertArgs} args - Arguments to update or create a Setting.
     * @example
     * // Update or create a Setting
     * const setting = await prisma.setting.upsert({
     *   create: {
     *     // ... data to create a Setting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Setting we want to update
     *   }
     * })
     */
    upsert<T extends SettingUpsertArgs>(args: SelectSubset<T, SettingUpsertArgs<ExtArgs>>): Prisma__SettingClient<$Result.GetResult<Prisma.$SettingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingCountArgs} args - Arguments to filter Settings to count.
     * @example
     * // Count the number of Settings
     * const count = await prisma.setting.count({
     *   where: {
     *     // ... the filter for the Settings we want to count
     *   }
     * })
    **/
    count<T extends SettingCountArgs>(
      args?: Subset<T, SettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Setting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SettingAggregateArgs>(args: Subset<T, SettingAggregateArgs>): Prisma.PrismaPromise<GetSettingAggregateType<T>>

    /**
     * Group by Setting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SettingGroupByArgs['orderBy'] }
        : { orderBy?: SettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Setting model
   */
  readonly fields: SettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Setting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Setting model
   */ 
  interface SettingFieldRefs {
    readonly id: FieldRef<"Setting", 'String'>
    readonly data: FieldRef<"Setting", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Setting findUnique
   */
  export type SettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting findUniqueOrThrow
   */
  export type SettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting findFirst
   */
  export type SettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Settings.
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Settings.
     */
    distinct?: SettingScalarFieldEnum | SettingScalarFieldEnum[]
  }

  /**
   * Setting findFirstOrThrow
   */
  export type SettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Filter, which Setting to fetch.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Settings.
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Settings.
     */
    distinct?: SettingScalarFieldEnum | SettingScalarFieldEnum[]
  }

  /**
   * Setting findMany
   */
  export type SettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Filter, which Settings to fetch.
     */
    where?: SettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Settings to fetch.
     */
    orderBy?: SettingOrderByWithRelationInput | SettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Settings.
     */
    cursor?: SettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Settings.
     */
    skip?: number
    distinct?: SettingScalarFieldEnum | SettingScalarFieldEnum[]
  }

  /**
   * Setting create
   */
  export type SettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * The data needed to create a Setting.
     */
    data: XOR<SettingCreateInput, SettingUncheckedCreateInput>
  }

  /**
   * Setting createMany
   */
  export type SettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Settings.
     */
    data: SettingCreateManyInput | SettingCreateManyInput[]
  }

  /**
   * Setting createManyAndReturn
   */
  export type SettingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Settings.
     */
    data: SettingCreateManyInput | SettingCreateManyInput[]
  }

  /**
   * Setting update
   */
  export type SettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * The data needed to update a Setting.
     */
    data: XOR<SettingUpdateInput, SettingUncheckedUpdateInput>
    /**
     * Choose, which Setting to update.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting updateMany
   */
  export type SettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Settings.
     */
    data: XOR<SettingUpdateManyMutationInput, SettingUncheckedUpdateManyInput>
    /**
     * Filter which Settings to update
     */
    where?: SettingWhereInput
  }

  /**
   * Setting upsert
   */
  export type SettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * The filter to search for the Setting to update in case it exists.
     */
    where: SettingWhereUniqueInput
    /**
     * In case the Setting found by the `where` argument doesn't exist, create a new Setting with this data.
     */
    create: XOR<SettingCreateInput, SettingUncheckedCreateInput>
    /**
     * In case the Setting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SettingUpdateInput, SettingUncheckedUpdateInput>
  }

  /**
   * Setting delete
   */
  export type SettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
    /**
     * Filter which Setting to delete.
     */
    where: SettingWhereUniqueInput
  }

  /**
   * Setting deleteMany
   */
  export type SettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Settings to delete
     */
    where?: SettingWhereInput
  }

  /**
   * Setting without action
   */
  export type SettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Setting
     */
    select?: SettingSelect<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    role: string | null
    password: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    role: string | null
    password: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    role: number
    password: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    password?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    password?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    password?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    name: string
    role: string
    password: string
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    password?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    password?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    password?: boolean
  }


  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      name: string
      role: string
      password: string
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
  }


  /**
   * Model ItemAudit
   */

  export type AggregateItemAudit = {
    _count: ItemAuditCountAggregateOutputType | null
    _min: ItemAuditMinAggregateOutputType | null
    _max: ItemAuditMaxAggregateOutputType | null
  }

  export type ItemAuditMinAggregateOutputType = {
    id: string | null
    itemId: string | null
    itemName: string | null
    userId: string | null
    userName: string | null
    action: string | null
    changes: string | null
    timestamp: Date | null
  }

  export type ItemAuditMaxAggregateOutputType = {
    id: string | null
    itemId: string | null
    itemName: string | null
    userId: string | null
    userName: string | null
    action: string | null
    changes: string | null
    timestamp: Date | null
  }

  export type ItemAuditCountAggregateOutputType = {
    id: number
    itemId: number
    itemName: number
    userId: number
    userName: number
    action: number
    changes: number
    timestamp: number
    _all: number
  }


  export type ItemAuditMinAggregateInputType = {
    id?: true
    itemId?: true
    itemName?: true
    userId?: true
    userName?: true
    action?: true
    changes?: true
    timestamp?: true
  }

  export type ItemAuditMaxAggregateInputType = {
    id?: true
    itemId?: true
    itemName?: true
    userId?: true
    userName?: true
    action?: true
    changes?: true
    timestamp?: true
  }

  export type ItemAuditCountAggregateInputType = {
    id?: true
    itemId?: true
    itemName?: true
    userId?: true
    userName?: true
    action?: true
    changes?: true
    timestamp?: true
    _all?: true
  }

  export type ItemAuditAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ItemAudit to aggregate.
     */
    where?: ItemAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemAudits to fetch.
     */
    orderBy?: ItemAuditOrderByWithRelationInput | ItemAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ItemAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemAudits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ItemAudits
    **/
    _count?: true | ItemAuditCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ItemAuditMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ItemAuditMaxAggregateInputType
  }

  export type GetItemAuditAggregateType<T extends ItemAuditAggregateArgs> = {
        [P in keyof T & keyof AggregateItemAudit]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateItemAudit[P]>
      : GetScalarType<T[P], AggregateItemAudit[P]>
  }




  export type ItemAuditGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemAuditWhereInput
    orderBy?: ItemAuditOrderByWithAggregationInput | ItemAuditOrderByWithAggregationInput[]
    by: ItemAuditScalarFieldEnum[] | ItemAuditScalarFieldEnum
    having?: ItemAuditScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ItemAuditCountAggregateInputType | true
    _min?: ItemAuditMinAggregateInputType
    _max?: ItemAuditMaxAggregateInputType
  }

  export type ItemAuditGroupByOutputType = {
    id: string
    itemId: string | null
    itemName: string
    userId: string | null
    userName: string | null
    action: string
    changes: string | null
    timestamp: Date
    _count: ItemAuditCountAggregateOutputType | null
    _min: ItemAuditMinAggregateOutputType | null
    _max: ItemAuditMaxAggregateOutputType | null
  }

  type GetItemAuditGroupByPayload<T extends ItemAuditGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ItemAuditGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ItemAuditGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ItemAuditGroupByOutputType[P]>
            : GetScalarType<T[P], ItemAuditGroupByOutputType[P]>
        }
      >
    >


  export type ItemAuditSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    itemName?: boolean
    userId?: boolean
    userName?: boolean
    action?: boolean
    changes?: boolean
    timestamp?: boolean
    item?: boolean | ItemAudit$itemArgs<ExtArgs>
  }, ExtArgs["result"]["itemAudit"]>

  export type ItemAuditSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    itemName?: boolean
    userId?: boolean
    userName?: boolean
    action?: boolean
    changes?: boolean
    timestamp?: boolean
    item?: boolean | ItemAudit$itemArgs<ExtArgs>
  }, ExtArgs["result"]["itemAudit"]>

  export type ItemAuditSelectScalar = {
    id?: boolean
    itemId?: boolean
    itemName?: boolean
    userId?: boolean
    userName?: boolean
    action?: boolean
    changes?: boolean
    timestamp?: boolean
  }

  export type ItemAuditInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemAudit$itemArgs<ExtArgs>
  }
  export type ItemAuditIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemAudit$itemArgs<ExtArgs>
  }

  export type $ItemAuditPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ItemAudit"
    objects: {
      item: Prisma.$ItemPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      itemId: string | null
      itemName: string
      userId: string | null
      userName: string | null
      action: string
      changes: string | null
      timestamp: Date
    }, ExtArgs["result"]["itemAudit"]>
    composites: {}
  }

  type ItemAuditGetPayload<S extends boolean | null | undefined | ItemAuditDefaultArgs> = $Result.GetResult<Prisma.$ItemAuditPayload, S>

  type ItemAuditCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ItemAuditFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ItemAuditCountAggregateInputType | true
    }

  export interface ItemAuditDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ItemAudit'], meta: { name: 'ItemAudit' } }
    /**
     * Find zero or one ItemAudit that matches the filter.
     * @param {ItemAuditFindUniqueArgs} args - Arguments to find a ItemAudit
     * @example
     * // Get one ItemAudit
     * const itemAudit = await prisma.itemAudit.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ItemAuditFindUniqueArgs>(args: SelectSubset<T, ItemAuditFindUniqueArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ItemAudit that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ItemAuditFindUniqueOrThrowArgs} args - Arguments to find a ItemAudit
     * @example
     * // Get one ItemAudit
     * const itemAudit = await prisma.itemAudit.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ItemAuditFindUniqueOrThrowArgs>(args: SelectSubset<T, ItemAuditFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ItemAudit that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAuditFindFirstArgs} args - Arguments to find a ItemAudit
     * @example
     * // Get one ItemAudit
     * const itemAudit = await prisma.itemAudit.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ItemAuditFindFirstArgs>(args?: SelectSubset<T, ItemAuditFindFirstArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ItemAudit that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAuditFindFirstOrThrowArgs} args - Arguments to find a ItemAudit
     * @example
     * // Get one ItemAudit
     * const itemAudit = await prisma.itemAudit.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ItemAuditFindFirstOrThrowArgs>(args?: SelectSubset<T, ItemAuditFindFirstOrThrowArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ItemAudits that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAuditFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ItemAudits
     * const itemAudits = await prisma.itemAudit.findMany()
     * 
     * // Get first 10 ItemAudits
     * const itemAudits = await prisma.itemAudit.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const itemAuditWithIdOnly = await prisma.itemAudit.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ItemAuditFindManyArgs>(args?: SelectSubset<T, ItemAuditFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ItemAudit.
     * @param {ItemAuditCreateArgs} args - Arguments to create a ItemAudit.
     * @example
     * // Create one ItemAudit
     * const ItemAudit = await prisma.itemAudit.create({
     *   data: {
     *     // ... data to create a ItemAudit
     *   }
     * })
     * 
     */
    create<T extends ItemAuditCreateArgs>(args: SelectSubset<T, ItemAuditCreateArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ItemAudits.
     * @param {ItemAuditCreateManyArgs} args - Arguments to create many ItemAudits.
     * @example
     * // Create many ItemAudits
     * const itemAudit = await prisma.itemAudit.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ItemAuditCreateManyArgs>(args?: SelectSubset<T, ItemAuditCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ItemAudits and returns the data saved in the database.
     * @param {ItemAuditCreateManyAndReturnArgs} args - Arguments to create many ItemAudits.
     * @example
     * // Create many ItemAudits
     * const itemAudit = await prisma.itemAudit.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ItemAudits and only return the `id`
     * const itemAuditWithIdOnly = await prisma.itemAudit.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ItemAuditCreateManyAndReturnArgs>(args?: SelectSubset<T, ItemAuditCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ItemAudit.
     * @param {ItemAuditDeleteArgs} args - Arguments to delete one ItemAudit.
     * @example
     * // Delete one ItemAudit
     * const ItemAudit = await prisma.itemAudit.delete({
     *   where: {
     *     // ... filter to delete one ItemAudit
     *   }
     * })
     * 
     */
    delete<T extends ItemAuditDeleteArgs>(args: SelectSubset<T, ItemAuditDeleteArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ItemAudit.
     * @param {ItemAuditUpdateArgs} args - Arguments to update one ItemAudit.
     * @example
     * // Update one ItemAudit
     * const itemAudit = await prisma.itemAudit.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ItemAuditUpdateArgs>(args: SelectSubset<T, ItemAuditUpdateArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ItemAudits.
     * @param {ItemAuditDeleteManyArgs} args - Arguments to filter ItemAudits to delete.
     * @example
     * // Delete a few ItemAudits
     * const { count } = await prisma.itemAudit.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ItemAuditDeleteManyArgs>(args?: SelectSubset<T, ItemAuditDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ItemAudits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAuditUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ItemAudits
     * const itemAudit = await prisma.itemAudit.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ItemAuditUpdateManyArgs>(args: SelectSubset<T, ItemAuditUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ItemAudit.
     * @param {ItemAuditUpsertArgs} args - Arguments to update or create a ItemAudit.
     * @example
     * // Update or create a ItemAudit
     * const itemAudit = await prisma.itemAudit.upsert({
     *   create: {
     *     // ... data to create a ItemAudit
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ItemAudit we want to update
     *   }
     * })
     */
    upsert<T extends ItemAuditUpsertArgs>(args: SelectSubset<T, ItemAuditUpsertArgs<ExtArgs>>): Prisma__ItemAuditClient<$Result.GetResult<Prisma.$ItemAuditPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ItemAudits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAuditCountArgs} args - Arguments to filter ItemAudits to count.
     * @example
     * // Count the number of ItemAudits
     * const count = await prisma.itemAudit.count({
     *   where: {
     *     // ... the filter for the ItemAudits we want to count
     *   }
     * })
    **/
    count<T extends ItemAuditCountArgs>(
      args?: Subset<T, ItemAuditCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ItemAuditCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ItemAudit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAuditAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ItemAuditAggregateArgs>(args: Subset<T, ItemAuditAggregateArgs>): Prisma.PrismaPromise<GetItemAuditAggregateType<T>>

    /**
     * Group by ItemAudit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAuditGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ItemAuditGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ItemAuditGroupByArgs['orderBy'] }
        : { orderBy?: ItemAuditGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ItemAuditGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetItemAuditGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ItemAudit model
   */
  readonly fields: ItemAuditFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ItemAudit.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ItemAuditClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    item<T extends ItemAudit$itemArgs<ExtArgs> = {}>(args?: Subset<T, ItemAudit$itemArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ItemAudit model
   */ 
  interface ItemAuditFieldRefs {
    readonly id: FieldRef<"ItemAudit", 'String'>
    readonly itemId: FieldRef<"ItemAudit", 'String'>
    readonly itemName: FieldRef<"ItemAudit", 'String'>
    readonly userId: FieldRef<"ItemAudit", 'String'>
    readonly userName: FieldRef<"ItemAudit", 'String'>
    readonly action: FieldRef<"ItemAudit", 'String'>
    readonly changes: FieldRef<"ItemAudit", 'String'>
    readonly timestamp: FieldRef<"ItemAudit", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ItemAudit findUnique
   */
  export type ItemAuditFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * Filter, which ItemAudit to fetch.
     */
    where: ItemAuditWhereUniqueInput
  }

  /**
   * ItemAudit findUniqueOrThrow
   */
  export type ItemAuditFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * Filter, which ItemAudit to fetch.
     */
    where: ItemAuditWhereUniqueInput
  }

  /**
   * ItemAudit findFirst
   */
  export type ItemAuditFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * Filter, which ItemAudit to fetch.
     */
    where?: ItemAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemAudits to fetch.
     */
    orderBy?: ItemAuditOrderByWithRelationInput | ItemAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ItemAudits.
     */
    cursor?: ItemAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemAudits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ItemAudits.
     */
    distinct?: ItemAuditScalarFieldEnum | ItemAuditScalarFieldEnum[]
  }

  /**
   * ItemAudit findFirstOrThrow
   */
  export type ItemAuditFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * Filter, which ItemAudit to fetch.
     */
    where?: ItemAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemAudits to fetch.
     */
    orderBy?: ItemAuditOrderByWithRelationInput | ItemAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ItemAudits.
     */
    cursor?: ItemAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemAudits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ItemAudits.
     */
    distinct?: ItemAuditScalarFieldEnum | ItemAuditScalarFieldEnum[]
  }

  /**
   * ItemAudit findMany
   */
  export type ItemAuditFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * Filter, which ItemAudits to fetch.
     */
    where?: ItemAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemAudits to fetch.
     */
    orderBy?: ItemAuditOrderByWithRelationInput | ItemAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ItemAudits.
     */
    cursor?: ItemAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemAudits.
     */
    skip?: number
    distinct?: ItemAuditScalarFieldEnum | ItemAuditScalarFieldEnum[]
  }

  /**
   * ItemAudit create
   */
  export type ItemAuditCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * The data needed to create a ItemAudit.
     */
    data: XOR<ItemAuditCreateInput, ItemAuditUncheckedCreateInput>
  }

  /**
   * ItemAudit createMany
   */
  export type ItemAuditCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ItemAudits.
     */
    data: ItemAuditCreateManyInput | ItemAuditCreateManyInput[]
  }

  /**
   * ItemAudit createManyAndReturn
   */
  export type ItemAuditCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ItemAudits.
     */
    data: ItemAuditCreateManyInput | ItemAuditCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ItemAudit update
   */
  export type ItemAuditUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * The data needed to update a ItemAudit.
     */
    data: XOR<ItemAuditUpdateInput, ItemAuditUncheckedUpdateInput>
    /**
     * Choose, which ItemAudit to update.
     */
    where: ItemAuditWhereUniqueInput
  }

  /**
   * ItemAudit updateMany
   */
  export type ItemAuditUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ItemAudits.
     */
    data: XOR<ItemAuditUpdateManyMutationInput, ItemAuditUncheckedUpdateManyInput>
    /**
     * Filter which ItemAudits to update
     */
    where?: ItemAuditWhereInput
  }

  /**
   * ItemAudit upsert
   */
  export type ItemAuditUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * The filter to search for the ItemAudit to update in case it exists.
     */
    where: ItemAuditWhereUniqueInput
    /**
     * In case the ItemAudit found by the `where` argument doesn't exist, create a new ItemAudit with this data.
     */
    create: XOR<ItemAuditCreateInput, ItemAuditUncheckedCreateInput>
    /**
     * In case the ItemAudit was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ItemAuditUpdateInput, ItemAuditUncheckedUpdateInput>
  }

  /**
   * ItemAudit delete
   */
  export type ItemAuditDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
    /**
     * Filter which ItemAudit to delete.
     */
    where: ItemAuditWhereUniqueInput
  }

  /**
   * ItemAudit deleteMany
   */
  export type ItemAuditDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ItemAudits to delete
     */
    where?: ItemAuditWhereInput
  }

  /**
   * ItemAudit.item
   */
  export type ItemAudit$itemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
  }

  /**
   * ItemAudit without action
   */
  export type ItemAuditDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemAudit
     */
    select?: ItemAuditSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemAuditInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    color: 'color',
    icon: 'icon',
    isActive: 'isActive'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const LocationScalarFieldEnum: {
    id: 'id',
    name: 'name'
  };

  export type LocationScalarFieldEnum = (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum]


  export const ItemScalarFieldEnum: {
    id: 'id',
    name: 'name',
    inventoryCode: 'inventoryCode',
    categoryId: 'categoryId',
    type: 'type',
    stock: 'stock',
    minStock: 'minStock',
    unit: 'unit',
    status: 'status',
    statusDetails: 'statusDetails',
    locationId: 'locationId',
    aisle: 'aisle',
    shelf: 'shelf',
    bin: 'bin',
    assignedTo: 'assignedTo',
    imageUrl: 'imageUrl',
    isApprovalRequired: 'isApprovalRequired',
    isKit: 'isKit',
    nextMaintenanceDate: 'nextMaintenanceDate',
    parentId: 'parentId',
    lastUpdated: 'lastUpdated',
    createdAt: 'createdAt'
  };

  export type ItemScalarFieldEnum = (typeof ItemScalarFieldEnum)[keyof typeof ItemScalarFieldEnum]


  export const InventoryLogScalarFieldEnum: {
    id: 'id',
    itemId: 'itemId',
    workerId: 'workerId',
    action: 'action',
    quantity: 'quantity',
    balance: 'balance',
    notes: 'notes',
    timestamp: 'timestamp'
  };

  export type InventoryLogScalarFieldEnum = (typeof InventoryLogScalarFieldEnum)[keyof typeof InventoryLogScalarFieldEnum]


  export const InventoryBorrowingScalarFieldEnum: {
    id: 'id',
    itemId: 'itemId',
    quantity: 'quantity',
    borrowerId: 'borrowerId',
    borrowerName: 'borrowerName',
    borrowerEmail: 'borrowerEmail',
    borrowedAt: 'borrowedAt',
    dueDate: 'dueDate',
    returnedAt: 'returnedAt',
    status: 'status',
    checkoutNotes: 'checkoutNotes',
    checkoutCondition: 'checkoutCondition',
    checkoutChecklist: 'checkoutChecklist',
    returnNotes: 'returnNotes',
    returnCondition: 'returnCondition',
    returnChecklist: 'returnChecklist',
    returnPhotos: 'returnPhotos'
  };

  export type InventoryBorrowingScalarFieldEnum = (typeof InventoryBorrowingScalarFieldEnum)[keyof typeof InventoryBorrowingScalarFieldEnum]


  export const SettingScalarFieldEnum: {
    id: 'id',
    data: 'data'
  };

  export type SettingScalarFieldEnum = (typeof SettingScalarFieldEnum)[keyof typeof SettingScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    role: 'role',
    password: 'password'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ItemAuditScalarFieldEnum: {
    id: 'id',
    itemId: 'itemId',
    itemName: 'itemName',
    userId: 'userId',
    userName: 'userName',
    action: 'action',
    changes: 'changes',
    timestamp: 'timestamp'
  };

  export type ItemAuditScalarFieldEnum = (typeof ItemAuditScalarFieldEnum)[keyof typeof ItemAuditScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    description?: StringNullableFilter<"Category"> | string | null
    color?: StringNullableFilter<"Category"> | string | null
    icon?: StringNullableFilter<"Category"> | string | null
    isActive?: BoolFilter<"Category"> | boolean
    items?: ItemListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    isActive?: SortOrder
    items?: ItemOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    description?: StringNullableFilter<"Category"> | string | null
    color?: StringNullableFilter<"Category"> | string | null
    icon?: StringNullableFilter<"Category"> | string | null
    isActive?: BoolFilter<"Category"> | boolean
    items?: ItemListRelationFilter
  }, "id" | "name">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    isActive?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Category"> | string
    name?: StringWithAggregatesFilter<"Category"> | string
    description?: StringNullableWithAggregatesFilter<"Category"> | string | null
    color?: StringNullableWithAggregatesFilter<"Category"> | string | null
    icon?: StringNullableWithAggregatesFilter<"Category"> | string | null
    isActive?: BoolWithAggregatesFilter<"Category"> | boolean
  }

  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    id?: StringFilter<"Location"> | string
    name?: StringFilter<"Location"> | string
    items?: ItemListRelationFilter
  }

  export type LocationOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    items?: ItemOrderByRelationAggregateInput
  }

  export type LocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    items?: ItemListRelationFilter
  }, "id" | "name">

  export type LocationOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    _count?: LocationCountOrderByAggregateInput
    _max?: LocationMaxOrderByAggregateInput
    _min?: LocationMinOrderByAggregateInput
  }

  export type LocationScalarWhereWithAggregatesInput = {
    AND?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    OR?: LocationScalarWhereWithAggregatesInput[]
    NOT?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Location"> | string
    name?: StringWithAggregatesFilter<"Location"> | string
  }

  export type ItemWhereInput = {
    AND?: ItemWhereInput | ItemWhereInput[]
    OR?: ItemWhereInput[]
    NOT?: ItemWhereInput | ItemWhereInput[]
    id?: StringFilter<"Item"> | string
    name?: StringFilter<"Item"> | string
    inventoryCode?: StringNullableFilter<"Item"> | string | null
    categoryId?: StringFilter<"Item"> | string
    type?: StringFilter<"Item"> | string
    stock?: IntFilter<"Item"> | number
    minStock?: IntFilter<"Item"> | number
    unit?: StringFilter<"Item"> | string
    status?: StringFilter<"Item"> | string
    statusDetails?: StringNullableFilter<"Item"> | string | null
    locationId?: StringNullableFilter<"Item"> | string | null
    aisle?: StringNullableFilter<"Item"> | string | null
    shelf?: StringNullableFilter<"Item"> | string | null
    bin?: StringNullableFilter<"Item"> | string | null
    assignedTo?: StringNullableFilter<"Item"> | string | null
    imageUrl?: StringNullableFilter<"Item"> | string | null
    isApprovalRequired?: BoolFilter<"Item"> | boolean
    isKit?: BoolFilter<"Item"> | boolean
    nextMaintenanceDate?: DateTimeNullableFilter<"Item"> | Date | string | null
    parentId?: StringNullableFilter<"Item"> | string | null
    lastUpdated?: DateTimeFilter<"Item"> | Date | string
    createdAt?: DateTimeFilter<"Item"> | Date | string
    category?: XOR<CategoryRelationFilter, CategoryWhereInput>
    location?: XOR<LocationNullableRelationFilter, LocationWhereInput> | null
    parent?: XOR<ItemNullableRelationFilter, ItemWhereInput> | null
    children?: ItemListRelationFilter
    logs?: InventoryLogListRelationFilter
    borrowings?: InventoryBorrowingListRelationFilter
    audits?: ItemAuditListRelationFilter
  }

  export type ItemOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    inventoryCode?: SortOrderInput | SortOrder
    categoryId?: SortOrder
    type?: SortOrder
    stock?: SortOrder
    minStock?: SortOrder
    unit?: SortOrder
    status?: SortOrder
    statusDetails?: SortOrderInput | SortOrder
    locationId?: SortOrderInput | SortOrder
    aisle?: SortOrderInput | SortOrder
    shelf?: SortOrderInput | SortOrder
    bin?: SortOrderInput | SortOrder
    assignedTo?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    isApprovalRequired?: SortOrder
    isKit?: SortOrder
    nextMaintenanceDate?: SortOrderInput | SortOrder
    parentId?: SortOrderInput | SortOrder
    lastUpdated?: SortOrder
    createdAt?: SortOrder
    category?: CategoryOrderByWithRelationInput
    location?: LocationOrderByWithRelationInput
    parent?: ItemOrderByWithRelationInput
    children?: ItemOrderByRelationAggregateInput
    logs?: InventoryLogOrderByRelationAggregateInput
    borrowings?: InventoryBorrowingOrderByRelationAggregateInput
    audits?: ItemAuditOrderByRelationAggregateInput
  }

  export type ItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    inventoryCode?: string
    AND?: ItemWhereInput | ItemWhereInput[]
    OR?: ItemWhereInput[]
    NOT?: ItemWhereInput | ItemWhereInput[]
    name?: StringFilter<"Item"> | string
    categoryId?: StringFilter<"Item"> | string
    type?: StringFilter<"Item"> | string
    stock?: IntFilter<"Item"> | number
    minStock?: IntFilter<"Item"> | number
    unit?: StringFilter<"Item"> | string
    status?: StringFilter<"Item"> | string
    statusDetails?: StringNullableFilter<"Item"> | string | null
    locationId?: StringNullableFilter<"Item"> | string | null
    aisle?: StringNullableFilter<"Item"> | string | null
    shelf?: StringNullableFilter<"Item"> | string | null
    bin?: StringNullableFilter<"Item"> | string | null
    assignedTo?: StringNullableFilter<"Item"> | string | null
    imageUrl?: StringNullableFilter<"Item"> | string | null
    isApprovalRequired?: BoolFilter<"Item"> | boolean
    isKit?: BoolFilter<"Item"> | boolean
    nextMaintenanceDate?: DateTimeNullableFilter<"Item"> | Date | string | null
    parentId?: StringNullableFilter<"Item"> | string | null
    lastUpdated?: DateTimeFilter<"Item"> | Date | string
    createdAt?: DateTimeFilter<"Item"> | Date | string
    category?: XOR<CategoryRelationFilter, CategoryWhereInput>
    location?: XOR<LocationNullableRelationFilter, LocationWhereInput> | null
    parent?: XOR<ItemNullableRelationFilter, ItemWhereInput> | null
    children?: ItemListRelationFilter
    logs?: InventoryLogListRelationFilter
    borrowings?: InventoryBorrowingListRelationFilter
    audits?: ItemAuditListRelationFilter
  }, "id" | "inventoryCode">

  export type ItemOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    inventoryCode?: SortOrderInput | SortOrder
    categoryId?: SortOrder
    type?: SortOrder
    stock?: SortOrder
    minStock?: SortOrder
    unit?: SortOrder
    status?: SortOrder
    statusDetails?: SortOrderInput | SortOrder
    locationId?: SortOrderInput | SortOrder
    aisle?: SortOrderInput | SortOrder
    shelf?: SortOrderInput | SortOrder
    bin?: SortOrderInput | SortOrder
    assignedTo?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    isApprovalRequired?: SortOrder
    isKit?: SortOrder
    nextMaintenanceDate?: SortOrderInput | SortOrder
    parentId?: SortOrderInput | SortOrder
    lastUpdated?: SortOrder
    createdAt?: SortOrder
    _count?: ItemCountOrderByAggregateInput
    _avg?: ItemAvgOrderByAggregateInput
    _max?: ItemMaxOrderByAggregateInput
    _min?: ItemMinOrderByAggregateInput
    _sum?: ItemSumOrderByAggregateInput
  }

  export type ItemScalarWhereWithAggregatesInput = {
    AND?: ItemScalarWhereWithAggregatesInput | ItemScalarWhereWithAggregatesInput[]
    OR?: ItemScalarWhereWithAggregatesInput[]
    NOT?: ItemScalarWhereWithAggregatesInput | ItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Item"> | string
    name?: StringWithAggregatesFilter<"Item"> | string
    inventoryCode?: StringNullableWithAggregatesFilter<"Item"> | string | null
    categoryId?: StringWithAggregatesFilter<"Item"> | string
    type?: StringWithAggregatesFilter<"Item"> | string
    stock?: IntWithAggregatesFilter<"Item"> | number
    minStock?: IntWithAggregatesFilter<"Item"> | number
    unit?: StringWithAggregatesFilter<"Item"> | string
    status?: StringWithAggregatesFilter<"Item"> | string
    statusDetails?: StringNullableWithAggregatesFilter<"Item"> | string | null
    locationId?: StringNullableWithAggregatesFilter<"Item"> | string | null
    aisle?: StringNullableWithAggregatesFilter<"Item"> | string | null
    shelf?: StringNullableWithAggregatesFilter<"Item"> | string | null
    bin?: StringNullableWithAggregatesFilter<"Item"> | string | null
    assignedTo?: StringNullableWithAggregatesFilter<"Item"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"Item"> | string | null
    isApprovalRequired?: BoolWithAggregatesFilter<"Item"> | boolean
    isKit?: BoolWithAggregatesFilter<"Item"> | boolean
    nextMaintenanceDate?: DateTimeNullableWithAggregatesFilter<"Item"> | Date | string | null
    parentId?: StringNullableWithAggregatesFilter<"Item"> | string | null
    lastUpdated?: DateTimeWithAggregatesFilter<"Item"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Item"> | Date | string
  }

  export type InventoryLogWhereInput = {
    AND?: InventoryLogWhereInput | InventoryLogWhereInput[]
    OR?: InventoryLogWhereInput[]
    NOT?: InventoryLogWhereInput | InventoryLogWhereInput[]
    id?: StringFilter<"InventoryLog"> | string
    itemId?: StringFilter<"InventoryLog"> | string
    workerId?: StringNullableFilter<"InventoryLog"> | string | null
    action?: StringFilter<"InventoryLog"> | string
    quantity?: IntFilter<"InventoryLog"> | number
    balance?: IntFilter<"InventoryLog"> | number
    notes?: StringNullableFilter<"InventoryLog"> | string | null
    timestamp?: DateTimeFilter<"InventoryLog"> | Date | string
    item?: XOR<ItemRelationFilter, ItemWhereInput>
  }

  export type InventoryLogOrderByWithRelationInput = {
    id?: SortOrder
    itemId?: SortOrder
    workerId?: SortOrderInput | SortOrder
    action?: SortOrder
    quantity?: SortOrder
    balance?: SortOrder
    notes?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    item?: ItemOrderByWithRelationInput
  }

  export type InventoryLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InventoryLogWhereInput | InventoryLogWhereInput[]
    OR?: InventoryLogWhereInput[]
    NOT?: InventoryLogWhereInput | InventoryLogWhereInput[]
    itemId?: StringFilter<"InventoryLog"> | string
    workerId?: StringNullableFilter<"InventoryLog"> | string | null
    action?: StringFilter<"InventoryLog"> | string
    quantity?: IntFilter<"InventoryLog"> | number
    balance?: IntFilter<"InventoryLog"> | number
    notes?: StringNullableFilter<"InventoryLog"> | string | null
    timestamp?: DateTimeFilter<"InventoryLog"> | Date | string
    item?: XOR<ItemRelationFilter, ItemWhereInput>
  }, "id">

  export type InventoryLogOrderByWithAggregationInput = {
    id?: SortOrder
    itemId?: SortOrder
    workerId?: SortOrderInput | SortOrder
    action?: SortOrder
    quantity?: SortOrder
    balance?: SortOrder
    notes?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    _count?: InventoryLogCountOrderByAggregateInput
    _avg?: InventoryLogAvgOrderByAggregateInput
    _max?: InventoryLogMaxOrderByAggregateInput
    _min?: InventoryLogMinOrderByAggregateInput
    _sum?: InventoryLogSumOrderByAggregateInput
  }

  export type InventoryLogScalarWhereWithAggregatesInput = {
    AND?: InventoryLogScalarWhereWithAggregatesInput | InventoryLogScalarWhereWithAggregatesInput[]
    OR?: InventoryLogScalarWhereWithAggregatesInput[]
    NOT?: InventoryLogScalarWhereWithAggregatesInput | InventoryLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"InventoryLog"> | string
    itemId?: StringWithAggregatesFilter<"InventoryLog"> | string
    workerId?: StringNullableWithAggregatesFilter<"InventoryLog"> | string | null
    action?: StringWithAggregatesFilter<"InventoryLog"> | string
    quantity?: IntWithAggregatesFilter<"InventoryLog"> | number
    balance?: IntWithAggregatesFilter<"InventoryLog"> | number
    notes?: StringNullableWithAggregatesFilter<"InventoryLog"> | string | null
    timestamp?: DateTimeWithAggregatesFilter<"InventoryLog"> | Date | string
  }

  export type InventoryBorrowingWhereInput = {
    AND?: InventoryBorrowingWhereInput | InventoryBorrowingWhereInput[]
    OR?: InventoryBorrowingWhereInput[]
    NOT?: InventoryBorrowingWhereInput | InventoryBorrowingWhereInput[]
    id?: StringFilter<"InventoryBorrowing"> | string
    itemId?: StringFilter<"InventoryBorrowing"> | string
    quantity?: IntFilter<"InventoryBorrowing"> | number
    borrowerId?: StringFilter<"InventoryBorrowing"> | string
    borrowerName?: StringFilter<"InventoryBorrowing"> | string
    borrowerEmail?: StringNullableFilter<"InventoryBorrowing"> | string | null
    borrowedAt?: DateTimeFilter<"InventoryBorrowing"> | Date | string
    dueDate?: DateTimeNullableFilter<"InventoryBorrowing"> | Date | string | null
    returnedAt?: DateTimeNullableFilter<"InventoryBorrowing"> | Date | string | null
    status?: StringFilter<"InventoryBorrowing"> | string
    checkoutNotes?: StringNullableFilter<"InventoryBorrowing"> | string | null
    checkoutCondition?: StringNullableFilter<"InventoryBorrowing"> | string | null
    checkoutChecklist?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnNotes?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnCondition?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnChecklist?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnPhotos?: StringNullableFilter<"InventoryBorrowing"> | string | null
    item?: XOR<ItemRelationFilter, ItemWhereInput>
  }

  export type InventoryBorrowingOrderByWithRelationInput = {
    id?: SortOrder
    itemId?: SortOrder
    quantity?: SortOrder
    borrowerId?: SortOrder
    borrowerName?: SortOrder
    borrowerEmail?: SortOrderInput | SortOrder
    borrowedAt?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    returnedAt?: SortOrderInput | SortOrder
    status?: SortOrder
    checkoutNotes?: SortOrderInput | SortOrder
    checkoutCondition?: SortOrderInput | SortOrder
    checkoutChecklist?: SortOrderInput | SortOrder
    returnNotes?: SortOrderInput | SortOrder
    returnCondition?: SortOrderInput | SortOrder
    returnChecklist?: SortOrderInput | SortOrder
    returnPhotos?: SortOrderInput | SortOrder
    item?: ItemOrderByWithRelationInput
  }

  export type InventoryBorrowingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InventoryBorrowingWhereInput | InventoryBorrowingWhereInput[]
    OR?: InventoryBorrowingWhereInput[]
    NOT?: InventoryBorrowingWhereInput | InventoryBorrowingWhereInput[]
    itemId?: StringFilter<"InventoryBorrowing"> | string
    quantity?: IntFilter<"InventoryBorrowing"> | number
    borrowerId?: StringFilter<"InventoryBorrowing"> | string
    borrowerName?: StringFilter<"InventoryBorrowing"> | string
    borrowerEmail?: StringNullableFilter<"InventoryBorrowing"> | string | null
    borrowedAt?: DateTimeFilter<"InventoryBorrowing"> | Date | string
    dueDate?: DateTimeNullableFilter<"InventoryBorrowing"> | Date | string | null
    returnedAt?: DateTimeNullableFilter<"InventoryBorrowing"> | Date | string | null
    status?: StringFilter<"InventoryBorrowing"> | string
    checkoutNotes?: StringNullableFilter<"InventoryBorrowing"> | string | null
    checkoutCondition?: StringNullableFilter<"InventoryBorrowing"> | string | null
    checkoutChecklist?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnNotes?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnCondition?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnChecklist?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnPhotos?: StringNullableFilter<"InventoryBorrowing"> | string | null
    item?: XOR<ItemRelationFilter, ItemWhereInput>
  }, "id">

  export type InventoryBorrowingOrderByWithAggregationInput = {
    id?: SortOrder
    itemId?: SortOrder
    quantity?: SortOrder
    borrowerId?: SortOrder
    borrowerName?: SortOrder
    borrowerEmail?: SortOrderInput | SortOrder
    borrowedAt?: SortOrder
    dueDate?: SortOrderInput | SortOrder
    returnedAt?: SortOrderInput | SortOrder
    status?: SortOrder
    checkoutNotes?: SortOrderInput | SortOrder
    checkoutCondition?: SortOrderInput | SortOrder
    checkoutChecklist?: SortOrderInput | SortOrder
    returnNotes?: SortOrderInput | SortOrder
    returnCondition?: SortOrderInput | SortOrder
    returnChecklist?: SortOrderInput | SortOrder
    returnPhotos?: SortOrderInput | SortOrder
    _count?: InventoryBorrowingCountOrderByAggregateInput
    _avg?: InventoryBorrowingAvgOrderByAggregateInput
    _max?: InventoryBorrowingMaxOrderByAggregateInput
    _min?: InventoryBorrowingMinOrderByAggregateInput
    _sum?: InventoryBorrowingSumOrderByAggregateInput
  }

  export type InventoryBorrowingScalarWhereWithAggregatesInput = {
    AND?: InventoryBorrowingScalarWhereWithAggregatesInput | InventoryBorrowingScalarWhereWithAggregatesInput[]
    OR?: InventoryBorrowingScalarWhereWithAggregatesInput[]
    NOT?: InventoryBorrowingScalarWhereWithAggregatesInput | InventoryBorrowingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"InventoryBorrowing"> | string
    itemId?: StringWithAggregatesFilter<"InventoryBorrowing"> | string
    quantity?: IntWithAggregatesFilter<"InventoryBorrowing"> | number
    borrowerId?: StringWithAggregatesFilter<"InventoryBorrowing"> | string
    borrowerName?: StringWithAggregatesFilter<"InventoryBorrowing"> | string
    borrowerEmail?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
    borrowedAt?: DateTimeWithAggregatesFilter<"InventoryBorrowing"> | Date | string
    dueDate?: DateTimeNullableWithAggregatesFilter<"InventoryBorrowing"> | Date | string | null
    returnedAt?: DateTimeNullableWithAggregatesFilter<"InventoryBorrowing"> | Date | string | null
    status?: StringWithAggregatesFilter<"InventoryBorrowing"> | string
    checkoutNotes?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
    checkoutCondition?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
    checkoutChecklist?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
    returnNotes?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
    returnCondition?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
    returnChecklist?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
    returnPhotos?: StringNullableWithAggregatesFilter<"InventoryBorrowing"> | string | null
  }

  export type SettingWhereInput = {
    AND?: SettingWhereInput | SettingWhereInput[]
    OR?: SettingWhereInput[]
    NOT?: SettingWhereInput | SettingWhereInput[]
    id?: StringFilter<"Setting"> | string
    data?: StringFilter<"Setting"> | string
  }

  export type SettingOrderByWithRelationInput = {
    id?: SortOrder
    data?: SortOrder
  }

  export type SettingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SettingWhereInput | SettingWhereInput[]
    OR?: SettingWhereInput[]
    NOT?: SettingWhereInput | SettingWhereInput[]
    data?: StringFilter<"Setting"> | string
  }, "id">

  export type SettingOrderByWithAggregationInput = {
    id?: SortOrder
    data?: SortOrder
    _count?: SettingCountOrderByAggregateInput
    _max?: SettingMaxOrderByAggregateInput
    _min?: SettingMinOrderByAggregateInput
  }

  export type SettingScalarWhereWithAggregatesInput = {
    AND?: SettingScalarWhereWithAggregatesInput | SettingScalarWhereWithAggregatesInput[]
    OR?: SettingScalarWhereWithAggregatesInput[]
    NOT?: SettingScalarWhereWithAggregatesInput | SettingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Setting"> | string
    data?: StringWithAggregatesFilter<"Setting"> | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    role?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
  }

  export type ItemAuditWhereInput = {
    AND?: ItemAuditWhereInput | ItemAuditWhereInput[]
    OR?: ItemAuditWhereInput[]
    NOT?: ItemAuditWhereInput | ItemAuditWhereInput[]
    id?: StringFilter<"ItemAudit"> | string
    itemId?: StringNullableFilter<"ItemAudit"> | string | null
    itemName?: StringFilter<"ItemAudit"> | string
    userId?: StringNullableFilter<"ItemAudit"> | string | null
    userName?: StringNullableFilter<"ItemAudit"> | string | null
    action?: StringFilter<"ItemAudit"> | string
    changes?: StringNullableFilter<"ItemAudit"> | string | null
    timestamp?: DateTimeFilter<"ItemAudit"> | Date | string
    item?: XOR<ItemNullableRelationFilter, ItemWhereInput> | null
  }

  export type ItemAuditOrderByWithRelationInput = {
    id?: SortOrder
    itemId?: SortOrderInput | SortOrder
    itemName?: SortOrder
    userId?: SortOrderInput | SortOrder
    userName?: SortOrderInput | SortOrder
    action?: SortOrder
    changes?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    item?: ItemOrderByWithRelationInput
  }

  export type ItemAuditWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ItemAuditWhereInput | ItemAuditWhereInput[]
    OR?: ItemAuditWhereInput[]
    NOT?: ItemAuditWhereInput | ItemAuditWhereInput[]
    itemId?: StringNullableFilter<"ItemAudit"> | string | null
    itemName?: StringFilter<"ItemAudit"> | string
    userId?: StringNullableFilter<"ItemAudit"> | string | null
    userName?: StringNullableFilter<"ItemAudit"> | string | null
    action?: StringFilter<"ItemAudit"> | string
    changes?: StringNullableFilter<"ItemAudit"> | string | null
    timestamp?: DateTimeFilter<"ItemAudit"> | Date | string
    item?: XOR<ItemNullableRelationFilter, ItemWhereInput> | null
  }, "id">

  export type ItemAuditOrderByWithAggregationInput = {
    id?: SortOrder
    itemId?: SortOrderInput | SortOrder
    itemName?: SortOrder
    userId?: SortOrderInput | SortOrder
    userName?: SortOrderInput | SortOrder
    action?: SortOrder
    changes?: SortOrderInput | SortOrder
    timestamp?: SortOrder
    _count?: ItemAuditCountOrderByAggregateInput
    _max?: ItemAuditMaxOrderByAggregateInput
    _min?: ItemAuditMinOrderByAggregateInput
  }

  export type ItemAuditScalarWhereWithAggregatesInput = {
    AND?: ItemAuditScalarWhereWithAggregatesInput | ItemAuditScalarWhereWithAggregatesInput[]
    OR?: ItemAuditScalarWhereWithAggregatesInput[]
    NOT?: ItemAuditScalarWhereWithAggregatesInput | ItemAuditScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ItemAudit"> | string
    itemId?: StringNullableWithAggregatesFilter<"ItemAudit"> | string | null
    itemName?: StringWithAggregatesFilter<"ItemAudit"> | string
    userId?: StringNullableWithAggregatesFilter<"ItemAudit"> | string | null
    userName?: StringNullableWithAggregatesFilter<"ItemAudit"> | string | null
    action?: StringWithAggregatesFilter<"ItemAudit"> | string
    changes?: StringNullableWithAggregatesFilter<"ItemAudit"> | string | null
    timestamp?: DateTimeWithAggregatesFilter<"ItemAudit"> | Date | string
  }

  export type CategoryCreateInput = {
    id?: string
    name: string
    description?: string | null
    color?: string | null
    icon?: string | null
    isActive?: boolean
    items?: ItemCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    color?: string | null
    icon?: string | null
    isActive?: boolean
    items?: ItemUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    items?: ItemUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    items?: ItemUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    color?: string | null
    icon?: string | null
    isActive?: boolean
  }

  export type CategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type LocationCreateInput = {
    id?: string
    name: string
    items?: ItemCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateInput = {
    id?: string
    name: string
    items?: ItemUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    items?: ItemUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    items?: ItemUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type LocationCreateManyInput = {
    id?: string
    name: string
  }

  export type LocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type LocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type ItemCreateInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutItemsInput
    location?: LocationCreateNestedOneWithoutItemsInput
    parent?: ItemCreateNestedOneWithoutChildrenInput
    children?: ItemCreateNestedManyWithoutParentInput
    logs?: InventoryLogCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingCreateNestedManyWithoutItemInput
    audits?: ItemAuditCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    children?: ItemUncheckedCreateNestedManyWithoutParentInput
    logs?: InventoryLogUncheckedCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput
    audits?: ItemAuditUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutItemsNestedInput
    location?: LocationUpdateOneWithoutItemsNestedInput
    parent?: ItemUpdateOneWithoutChildrenNestedInput
    children?: ItemUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemUncheckedUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUncheckedUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateManyInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
  }

  export type ItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryLogCreateInput = {
    id?: string
    workerId?: string | null
    action: string
    quantity: number
    balance?: number
    notes?: string | null
    timestamp?: Date | string
    item: ItemCreateNestedOneWithoutLogsInput
  }

  export type InventoryLogUncheckedCreateInput = {
    id?: string
    itemId: string
    workerId?: string | null
    action: string
    quantity: number
    balance?: number
    notes?: string | null
    timestamp?: Date | string
  }

  export type InventoryLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    balance?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    item?: ItemUpdateOneRequiredWithoutLogsNestedInput
  }

  export type InventoryLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    workerId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    balance?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryLogCreateManyInput = {
    id?: string
    itemId: string
    workerId?: string | null
    action: string
    quantity: number
    balance?: number
    notes?: string | null
    timestamp?: Date | string
  }

  export type InventoryLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    balance?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    workerId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    balance?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryBorrowingCreateInput = {
    id?: string
    quantity?: number
    borrowerId: string
    borrowerName: string
    borrowerEmail?: string | null
    borrowedAt?: Date | string
    dueDate?: Date | string | null
    returnedAt?: Date | string | null
    status?: string
    checkoutNotes?: string | null
    checkoutCondition?: string | null
    checkoutChecklist?: string | null
    returnNotes?: string | null
    returnCondition?: string | null
    returnChecklist?: string | null
    returnPhotos?: string | null
    item: ItemCreateNestedOneWithoutBorrowingsInput
  }

  export type InventoryBorrowingUncheckedCreateInput = {
    id?: string
    itemId: string
    quantity?: number
    borrowerId: string
    borrowerName: string
    borrowerEmail?: string | null
    borrowedAt?: Date | string
    dueDate?: Date | string | null
    returnedAt?: Date | string | null
    status?: string
    checkoutNotes?: string | null
    checkoutCondition?: string | null
    checkoutChecklist?: string | null
    returnNotes?: string | null
    returnCondition?: string | null
    returnChecklist?: string | null
    returnPhotos?: string | null
  }

  export type InventoryBorrowingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    borrowerId?: StringFieldUpdateOperationsInput | string
    borrowerName?: StringFieldUpdateOperationsInput | string
    borrowerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    borrowedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    returnedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutCondition?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnNotes?: NullableStringFieldUpdateOperationsInput | string | null
    returnCondition?: NullableStringFieldUpdateOperationsInput | string | null
    returnChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnPhotos?: NullableStringFieldUpdateOperationsInput | string | null
    item?: ItemUpdateOneRequiredWithoutBorrowingsNestedInput
  }

  export type InventoryBorrowingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    borrowerId?: StringFieldUpdateOperationsInput | string
    borrowerName?: StringFieldUpdateOperationsInput | string
    borrowerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    borrowedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    returnedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutCondition?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnNotes?: NullableStringFieldUpdateOperationsInput | string | null
    returnCondition?: NullableStringFieldUpdateOperationsInput | string | null
    returnChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnPhotos?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type InventoryBorrowingCreateManyInput = {
    id?: string
    itemId: string
    quantity?: number
    borrowerId: string
    borrowerName: string
    borrowerEmail?: string | null
    borrowedAt?: Date | string
    dueDate?: Date | string | null
    returnedAt?: Date | string | null
    status?: string
    checkoutNotes?: string | null
    checkoutCondition?: string | null
    checkoutChecklist?: string | null
    returnNotes?: string | null
    returnCondition?: string | null
    returnChecklist?: string | null
    returnPhotos?: string | null
  }

  export type InventoryBorrowingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    borrowerId?: StringFieldUpdateOperationsInput | string
    borrowerName?: StringFieldUpdateOperationsInput | string
    borrowerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    borrowedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    returnedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutCondition?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnNotes?: NullableStringFieldUpdateOperationsInput | string | null
    returnCondition?: NullableStringFieldUpdateOperationsInput | string | null
    returnChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnPhotos?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type InventoryBorrowingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    borrowerId?: StringFieldUpdateOperationsInput | string
    borrowerName?: StringFieldUpdateOperationsInput | string
    borrowerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    borrowedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    returnedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutCondition?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnNotes?: NullableStringFieldUpdateOperationsInput | string | null
    returnCondition?: NullableStringFieldUpdateOperationsInput | string | null
    returnChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnPhotos?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SettingCreateInput = {
    id: string
    data: string
  }

  export type SettingUncheckedCreateInput = {
    id: string
    data: string
  }

  export type SettingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
  }

  export type SettingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
  }

  export type SettingCreateManyInput = {
    id: string
    data: string
  }

  export type SettingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
  }

  export type SettingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    data?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    name: string
    role?: string
    password: string
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    name: string
    role?: string
    password: string
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    name: string
    role?: string
    password: string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
  }

  export type ItemAuditCreateInput = {
    id?: string
    itemName: string
    userId?: string | null
    userName?: string | null
    action: string
    changes?: string | null
    timestamp?: Date | string
    item?: ItemCreateNestedOneWithoutAuditsInput
  }

  export type ItemAuditUncheckedCreateInput = {
    id?: string
    itemId?: string | null
    itemName: string
    userId?: string | null
    userName?: string | null
    action: string
    changes?: string | null
    timestamp?: Date | string
  }

  export type ItemAuditUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    changes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    item?: ItemUpdateOneWithoutAuditsNestedInput
  }

  export type ItemAuditUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    changes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemAuditCreateManyInput = {
    id?: string
    itemId?: string | null
    itemName: string
    userId?: string | null
    userName?: string | null
    action: string
    changes?: string | null
    timestamp?: Date | string
  }

  export type ItemAuditUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    changes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemAuditUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    changes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type ItemListRelationFilter = {
    every?: ItemWhereInput
    some?: ItemWhereInput
    none?: ItemWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    color?: SortOrder
    icon?: SortOrder
    isActive?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    color?: SortOrder
    icon?: SortOrder
    isActive?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    color?: SortOrder
    icon?: SortOrder
    isActive?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type LocationCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type LocationMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type LocationMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CategoryRelationFilter = {
    is?: CategoryWhereInput
    isNot?: CategoryWhereInput
  }

  export type LocationNullableRelationFilter = {
    is?: LocationWhereInput | null
    isNot?: LocationWhereInput | null
  }

  export type ItemNullableRelationFilter = {
    is?: ItemWhereInput | null
    isNot?: ItemWhereInput | null
  }

  export type InventoryLogListRelationFilter = {
    every?: InventoryLogWhereInput
    some?: InventoryLogWhereInput
    none?: InventoryLogWhereInput
  }

  export type InventoryBorrowingListRelationFilter = {
    every?: InventoryBorrowingWhereInput
    some?: InventoryBorrowingWhereInput
    none?: InventoryBorrowingWhereInput
  }

  export type ItemAuditListRelationFilter = {
    every?: ItemAuditWhereInput
    some?: ItemAuditWhereInput
    none?: ItemAuditWhereInput
  }

  export type InventoryLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InventoryBorrowingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ItemAuditOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ItemCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    inventoryCode?: SortOrder
    categoryId?: SortOrder
    type?: SortOrder
    stock?: SortOrder
    minStock?: SortOrder
    unit?: SortOrder
    status?: SortOrder
    statusDetails?: SortOrder
    locationId?: SortOrder
    aisle?: SortOrder
    shelf?: SortOrder
    bin?: SortOrder
    assignedTo?: SortOrder
    imageUrl?: SortOrder
    isApprovalRequired?: SortOrder
    isKit?: SortOrder
    nextMaintenanceDate?: SortOrder
    parentId?: SortOrder
    lastUpdated?: SortOrder
    createdAt?: SortOrder
  }

  export type ItemAvgOrderByAggregateInput = {
    stock?: SortOrder
    minStock?: SortOrder
  }

  export type ItemMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    inventoryCode?: SortOrder
    categoryId?: SortOrder
    type?: SortOrder
    stock?: SortOrder
    minStock?: SortOrder
    unit?: SortOrder
    status?: SortOrder
    statusDetails?: SortOrder
    locationId?: SortOrder
    aisle?: SortOrder
    shelf?: SortOrder
    bin?: SortOrder
    assignedTo?: SortOrder
    imageUrl?: SortOrder
    isApprovalRequired?: SortOrder
    isKit?: SortOrder
    nextMaintenanceDate?: SortOrder
    parentId?: SortOrder
    lastUpdated?: SortOrder
    createdAt?: SortOrder
  }

  export type ItemMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    inventoryCode?: SortOrder
    categoryId?: SortOrder
    type?: SortOrder
    stock?: SortOrder
    minStock?: SortOrder
    unit?: SortOrder
    status?: SortOrder
    statusDetails?: SortOrder
    locationId?: SortOrder
    aisle?: SortOrder
    shelf?: SortOrder
    bin?: SortOrder
    assignedTo?: SortOrder
    imageUrl?: SortOrder
    isApprovalRequired?: SortOrder
    isKit?: SortOrder
    nextMaintenanceDate?: SortOrder
    parentId?: SortOrder
    lastUpdated?: SortOrder
    createdAt?: SortOrder
  }

  export type ItemSumOrderByAggregateInput = {
    stock?: SortOrder
    minStock?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type ItemRelationFilter = {
    is?: ItemWhereInput
    isNot?: ItemWhereInput
  }

  export type InventoryLogCountOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    workerId?: SortOrder
    action?: SortOrder
    quantity?: SortOrder
    balance?: SortOrder
    notes?: SortOrder
    timestamp?: SortOrder
  }

  export type InventoryLogAvgOrderByAggregateInput = {
    quantity?: SortOrder
    balance?: SortOrder
  }

  export type InventoryLogMaxOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    workerId?: SortOrder
    action?: SortOrder
    quantity?: SortOrder
    balance?: SortOrder
    notes?: SortOrder
    timestamp?: SortOrder
  }

  export type InventoryLogMinOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    workerId?: SortOrder
    action?: SortOrder
    quantity?: SortOrder
    balance?: SortOrder
    notes?: SortOrder
    timestamp?: SortOrder
  }

  export type InventoryLogSumOrderByAggregateInput = {
    quantity?: SortOrder
    balance?: SortOrder
  }

  export type InventoryBorrowingCountOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    quantity?: SortOrder
    borrowerId?: SortOrder
    borrowerName?: SortOrder
    borrowerEmail?: SortOrder
    borrowedAt?: SortOrder
    dueDate?: SortOrder
    returnedAt?: SortOrder
    status?: SortOrder
    checkoutNotes?: SortOrder
    checkoutCondition?: SortOrder
    checkoutChecklist?: SortOrder
    returnNotes?: SortOrder
    returnCondition?: SortOrder
    returnChecklist?: SortOrder
    returnPhotos?: SortOrder
  }

  export type InventoryBorrowingAvgOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type InventoryBorrowingMaxOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    quantity?: SortOrder
    borrowerId?: SortOrder
    borrowerName?: SortOrder
    borrowerEmail?: SortOrder
    borrowedAt?: SortOrder
    dueDate?: SortOrder
    returnedAt?: SortOrder
    status?: SortOrder
    checkoutNotes?: SortOrder
    checkoutCondition?: SortOrder
    checkoutChecklist?: SortOrder
    returnNotes?: SortOrder
    returnCondition?: SortOrder
    returnChecklist?: SortOrder
    returnPhotos?: SortOrder
  }

  export type InventoryBorrowingMinOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    quantity?: SortOrder
    borrowerId?: SortOrder
    borrowerName?: SortOrder
    borrowerEmail?: SortOrder
    borrowedAt?: SortOrder
    dueDate?: SortOrder
    returnedAt?: SortOrder
    status?: SortOrder
    checkoutNotes?: SortOrder
    checkoutCondition?: SortOrder
    checkoutChecklist?: SortOrder
    returnNotes?: SortOrder
    returnCondition?: SortOrder
    returnChecklist?: SortOrder
    returnPhotos?: SortOrder
  }

  export type InventoryBorrowingSumOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type SettingCountOrderByAggregateInput = {
    id?: SortOrder
    data?: SortOrder
  }

  export type SettingMaxOrderByAggregateInput = {
    id?: SortOrder
    data?: SortOrder
  }

  export type SettingMinOrderByAggregateInput = {
    id?: SortOrder
    data?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
  }

  export type ItemAuditCountOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    itemName?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    action?: SortOrder
    changes?: SortOrder
    timestamp?: SortOrder
  }

  export type ItemAuditMaxOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    itemName?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    action?: SortOrder
    changes?: SortOrder
    timestamp?: SortOrder
  }

  export type ItemAuditMinOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    itemName?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    action?: SortOrder
    changes?: SortOrder
    timestamp?: SortOrder
  }

  export type ItemCreateNestedManyWithoutCategoryInput = {
    create?: XOR<ItemCreateWithoutCategoryInput, ItemUncheckedCreateWithoutCategoryInput> | ItemCreateWithoutCategoryInput[] | ItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCategoryInput | ItemCreateOrConnectWithoutCategoryInput[]
    createMany?: ItemCreateManyCategoryInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type ItemUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<ItemCreateWithoutCategoryInput, ItemUncheckedCreateWithoutCategoryInput> | ItemCreateWithoutCategoryInput[] | ItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCategoryInput | ItemCreateOrConnectWithoutCategoryInput[]
    createMany?: ItemCreateManyCategoryInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type ItemUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<ItemCreateWithoutCategoryInput, ItemUncheckedCreateWithoutCategoryInput> | ItemCreateWithoutCategoryInput[] | ItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCategoryInput | ItemCreateOrConnectWithoutCategoryInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutCategoryInput | ItemUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: ItemCreateManyCategoryInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutCategoryInput | ItemUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutCategoryInput | ItemUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type ItemUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<ItemCreateWithoutCategoryInput, ItemUncheckedCreateWithoutCategoryInput> | ItemCreateWithoutCategoryInput[] | ItemUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCategoryInput | ItemCreateOrConnectWithoutCategoryInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutCategoryInput | ItemUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: ItemCreateManyCategoryInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutCategoryInput | ItemUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutCategoryInput | ItemUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type ItemCreateNestedManyWithoutLocationInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type ItemUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type ItemUpdateManyWithoutLocationNestedInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutLocationInput | ItemUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutLocationInput | ItemUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutLocationInput | ItemUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type ItemUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutLocationInput | ItemUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutLocationInput | ItemUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutLocationInput | ItemUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type CategoryCreateNestedOneWithoutItemsInput = {
    create?: XOR<CategoryCreateWithoutItemsInput, CategoryUncheckedCreateWithoutItemsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutItemsInput
    connect?: CategoryWhereUniqueInput
  }

  export type LocationCreateNestedOneWithoutItemsInput = {
    create?: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
    connectOrCreate?: LocationCreateOrConnectWithoutItemsInput
    connect?: LocationWhereUniqueInput
  }

  export type ItemCreateNestedOneWithoutChildrenInput = {
    create?: XOR<ItemCreateWithoutChildrenInput, ItemUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: ItemCreateOrConnectWithoutChildrenInput
    connect?: ItemWhereUniqueInput
  }

  export type ItemCreateNestedManyWithoutParentInput = {
    create?: XOR<ItemCreateWithoutParentInput, ItemUncheckedCreateWithoutParentInput> | ItemCreateWithoutParentInput[] | ItemUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutParentInput | ItemCreateOrConnectWithoutParentInput[]
    createMany?: ItemCreateManyParentInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type InventoryLogCreateNestedManyWithoutItemInput = {
    create?: XOR<InventoryLogCreateWithoutItemInput, InventoryLogUncheckedCreateWithoutItemInput> | InventoryLogCreateWithoutItemInput[] | InventoryLogUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryLogCreateOrConnectWithoutItemInput | InventoryLogCreateOrConnectWithoutItemInput[]
    createMany?: InventoryLogCreateManyItemInputEnvelope
    connect?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
  }

  export type InventoryBorrowingCreateNestedManyWithoutItemInput = {
    create?: XOR<InventoryBorrowingCreateWithoutItemInput, InventoryBorrowingUncheckedCreateWithoutItemInput> | InventoryBorrowingCreateWithoutItemInput[] | InventoryBorrowingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryBorrowingCreateOrConnectWithoutItemInput | InventoryBorrowingCreateOrConnectWithoutItemInput[]
    createMany?: InventoryBorrowingCreateManyItemInputEnvelope
    connect?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
  }

  export type ItemAuditCreateNestedManyWithoutItemInput = {
    create?: XOR<ItemAuditCreateWithoutItemInput, ItemAuditUncheckedCreateWithoutItemInput> | ItemAuditCreateWithoutItemInput[] | ItemAuditUncheckedCreateWithoutItemInput[]
    connectOrCreate?: ItemAuditCreateOrConnectWithoutItemInput | ItemAuditCreateOrConnectWithoutItemInput[]
    createMany?: ItemAuditCreateManyItemInputEnvelope
    connect?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
  }

  export type ItemUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<ItemCreateWithoutParentInput, ItemUncheckedCreateWithoutParentInput> | ItemCreateWithoutParentInput[] | ItemUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutParentInput | ItemCreateOrConnectWithoutParentInput[]
    createMany?: ItemCreateManyParentInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type InventoryLogUncheckedCreateNestedManyWithoutItemInput = {
    create?: XOR<InventoryLogCreateWithoutItemInput, InventoryLogUncheckedCreateWithoutItemInput> | InventoryLogCreateWithoutItemInput[] | InventoryLogUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryLogCreateOrConnectWithoutItemInput | InventoryLogCreateOrConnectWithoutItemInput[]
    createMany?: InventoryLogCreateManyItemInputEnvelope
    connect?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
  }

  export type InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput = {
    create?: XOR<InventoryBorrowingCreateWithoutItemInput, InventoryBorrowingUncheckedCreateWithoutItemInput> | InventoryBorrowingCreateWithoutItemInput[] | InventoryBorrowingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryBorrowingCreateOrConnectWithoutItemInput | InventoryBorrowingCreateOrConnectWithoutItemInput[]
    createMany?: InventoryBorrowingCreateManyItemInputEnvelope
    connect?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
  }

  export type ItemAuditUncheckedCreateNestedManyWithoutItemInput = {
    create?: XOR<ItemAuditCreateWithoutItemInput, ItemAuditUncheckedCreateWithoutItemInput> | ItemAuditCreateWithoutItemInput[] | ItemAuditUncheckedCreateWithoutItemInput[]
    connectOrCreate?: ItemAuditCreateOrConnectWithoutItemInput | ItemAuditCreateOrConnectWithoutItemInput[]
    createMany?: ItemAuditCreateManyItemInputEnvelope
    connect?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CategoryUpdateOneRequiredWithoutItemsNestedInput = {
    create?: XOR<CategoryCreateWithoutItemsInput, CategoryUncheckedCreateWithoutItemsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutItemsInput
    upsert?: CategoryUpsertWithoutItemsInput
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutItemsInput, CategoryUpdateWithoutItemsInput>, CategoryUncheckedUpdateWithoutItemsInput>
  }

  export type LocationUpdateOneWithoutItemsNestedInput = {
    create?: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
    connectOrCreate?: LocationCreateOrConnectWithoutItemsInput
    upsert?: LocationUpsertWithoutItemsInput
    disconnect?: LocationWhereInput | boolean
    delete?: LocationWhereInput | boolean
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutItemsInput, LocationUpdateWithoutItemsInput>, LocationUncheckedUpdateWithoutItemsInput>
  }

  export type ItemUpdateOneWithoutChildrenNestedInput = {
    create?: XOR<ItemCreateWithoutChildrenInput, ItemUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: ItemCreateOrConnectWithoutChildrenInput
    upsert?: ItemUpsertWithoutChildrenInput
    disconnect?: ItemWhereInput | boolean
    delete?: ItemWhereInput | boolean
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutChildrenInput, ItemUpdateWithoutChildrenInput>, ItemUncheckedUpdateWithoutChildrenInput>
  }

  export type ItemUpdateManyWithoutParentNestedInput = {
    create?: XOR<ItemCreateWithoutParentInput, ItemUncheckedCreateWithoutParentInput> | ItemCreateWithoutParentInput[] | ItemUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutParentInput | ItemCreateOrConnectWithoutParentInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutParentInput | ItemUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: ItemCreateManyParentInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutParentInput | ItemUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutParentInput | ItemUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type InventoryLogUpdateManyWithoutItemNestedInput = {
    create?: XOR<InventoryLogCreateWithoutItemInput, InventoryLogUncheckedCreateWithoutItemInput> | InventoryLogCreateWithoutItemInput[] | InventoryLogUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryLogCreateOrConnectWithoutItemInput | InventoryLogCreateOrConnectWithoutItemInput[]
    upsert?: InventoryLogUpsertWithWhereUniqueWithoutItemInput | InventoryLogUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: InventoryLogCreateManyItemInputEnvelope
    set?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    disconnect?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    delete?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    connect?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    update?: InventoryLogUpdateWithWhereUniqueWithoutItemInput | InventoryLogUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: InventoryLogUpdateManyWithWhereWithoutItemInput | InventoryLogUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: InventoryLogScalarWhereInput | InventoryLogScalarWhereInput[]
  }

  export type InventoryBorrowingUpdateManyWithoutItemNestedInput = {
    create?: XOR<InventoryBorrowingCreateWithoutItemInput, InventoryBorrowingUncheckedCreateWithoutItemInput> | InventoryBorrowingCreateWithoutItemInput[] | InventoryBorrowingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryBorrowingCreateOrConnectWithoutItemInput | InventoryBorrowingCreateOrConnectWithoutItemInput[]
    upsert?: InventoryBorrowingUpsertWithWhereUniqueWithoutItemInput | InventoryBorrowingUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: InventoryBorrowingCreateManyItemInputEnvelope
    set?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    disconnect?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    delete?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    connect?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    update?: InventoryBorrowingUpdateWithWhereUniqueWithoutItemInput | InventoryBorrowingUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: InventoryBorrowingUpdateManyWithWhereWithoutItemInput | InventoryBorrowingUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: InventoryBorrowingScalarWhereInput | InventoryBorrowingScalarWhereInput[]
  }

  export type ItemAuditUpdateManyWithoutItemNestedInput = {
    create?: XOR<ItemAuditCreateWithoutItemInput, ItemAuditUncheckedCreateWithoutItemInput> | ItemAuditCreateWithoutItemInput[] | ItemAuditUncheckedCreateWithoutItemInput[]
    connectOrCreate?: ItemAuditCreateOrConnectWithoutItemInput | ItemAuditCreateOrConnectWithoutItemInput[]
    upsert?: ItemAuditUpsertWithWhereUniqueWithoutItemInput | ItemAuditUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: ItemAuditCreateManyItemInputEnvelope
    set?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    disconnect?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    delete?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    connect?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    update?: ItemAuditUpdateWithWhereUniqueWithoutItemInput | ItemAuditUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: ItemAuditUpdateManyWithWhereWithoutItemInput | ItemAuditUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: ItemAuditScalarWhereInput | ItemAuditScalarWhereInput[]
  }

  export type ItemUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<ItemCreateWithoutParentInput, ItemUncheckedCreateWithoutParentInput> | ItemCreateWithoutParentInput[] | ItemUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutParentInput | ItemCreateOrConnectWithoutParentInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutParentInput | ItemUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: ItemCreateManyParentInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutParentInput | ItemUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutParentInput | ItemUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type InventoryLogUncheckedUpdateManyWithoutItemNestedInput = {
    create?: XOR<InventoryLogCreateWithoutItemInput, InventoryLogUncheckedCreateWithoutItemInput> | InventoryLogCreateWithoutItemInput[] | InventoryLogUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryLogCreateOrConnectWithoutItemInput | InventoryLogCreateOrConnectWithoutItemInput[]
    upsert?: InventoryLogUpsertWithWhereUniqueWithoutItemInput | InventoryLogUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: InventoryLogCreateManyItemInputEnvelope
    set?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    disconnect?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    delete?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    connect?: InventoryLogWhereUniqueInput | InventoryLogWhereUniqueInput[]
    update?: InventoryLogUpdateWithWhereUniqueWithoutItemInput | InventoryLogUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: InventoryLogUpdateManyWithWhereWithoutItemInput | InventoryLogUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: InventoryLogScalarWhereInput | InventoryLogScalarWhereInput[]
  }

  export type InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput = {
    create?: XOR<InventoryBorrowingCreateWithoutItemInput, InventoryBorrowingUncheckedCreateWithoutItemInput> | InventoryBorrowingCreateWithoutItemInput[] | InventoryBorrowingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: InventoryBorrowingCreateOrConnectWithoutItemInput | InventoryBorrowingCreateOrConnectWithoutItemInput[]
    upsert?: InventoryBorrowingUpsertWithWhereUniqueWithoutItemInput | InventoryBorrowingUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: InventoryBorrowingCreateManyItemInputEnvelope
    set?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    disconnect?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    delete?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    connect?: InventoryBorrowingWhereUniqueInput | InventoryBorrowingWhereUniqueInput[]
    update?: InventoryBorrowingUpdateWithWhereUniqueWithoutItemInput | InventoryBorrowingUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: InventoryBorrowingUpdateManyWithWhereWithoutItemInput | InventoryBorrowingUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: InventoryBorrowingScalarWhereInput | InventoryBorrowingScalarWhereInput[]
  }

  export type ItemAuditUncheckedUpdateManyWithoutItemNestedInput = {
    create?: XOR<ItemAuditCreateWithoutItemInput, ItemAuditUncheckedCreateWithoutItemInput> | ItemAuditCreateWithoutItemInput[] | ItemAuditUncheckedCreateWithoutItemInput[]
    connectOrCreate?: ItemAuditCreateOrConnectWithoutItemInput | ItemAuditCreateOrConnectWithoutItemInput[]
    upsert?: ItemAuditUpsertWithWhereUniqueWithoutItemInput | ItemAuditUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: ItemAuditCreateManyItemInputEnvelope
    set?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    disconnect?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    delete?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    connect?: ItemAuditWhereUniqueInput | ItemAuditWhereUniqueInput[]
    update?: ItemAuditUpdateWithWhereUniqueWithoutItemInput | ItemAuditUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: ItemAuditUpdateManyWithWhereWithoutItemInput | ItemAuditUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: ItemAuditScalarWhereInput | ItemAuditScalarWhereInput[]
  }

  export type ItemCreateNestedOneWithoutLogsInput = {
    create?: XOR<ItemCreateWithoutLogsInput, ItemUncheckedCreateWithoutLogsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutLogsInput
    connect?: ItemWhereUniqueInput
  }

  export type ItemUpdateOneRequiredWithoutLogsNestedInput = {
    create?: XOR<ItemCreateWithoutLogsInput, ItemUncheckedCreateWithoutLogsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutLogsInput
    upsert?: ItemUpsertWithoutLogsInput
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutLogsInput, ItemUpdateWithoutLogsInput>, ItemUncheckedUpdateWithoutLogsInput>
  }

  export type ItemCreateNestedOneWithoutBorrowingsInput = {
    create?: XOR<ItemCreateWithoutBorrowingsInput, ItemUncheckedCreateWithoutBorrowingsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutBorrowingsInput
    connect?: ItemWhereUniqueInput
  }

  export type ItemUpdateOneRequiredWithoutBorrowingsNestedInput = {
    create?: XOR<ItemCreateWithoutBorrowingsInput, ItemUncheckedCreateWithoutBorrowingsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutBorrowingsInput
    upsert?: ItemUpsertWithoutBorrowingsInput
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutBorrowingsInput, ItemUpdateWithoutBorrowingsInput>, ItemUncheckedUpdateWithoutBorrowingsInput>
  }

  export type ItemCreateNestedOneWithoutAuditsInput = {
    create?: XOR<ItemCreateWithoutAuditsInput, ItemUncheckedCreateWithoutAuditsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutAuditsInput
    connect?: ItemWhereUniqueInput
  }

  export type ItemUpdateOneWithoutAuditsNestedInput = {
    create?: XOR<ItemCreateWithoutAuditsInput, ItemUncheckedCreateWithoutAuditsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutAuditsInput
    upsert?: ItemUpsertWithoutAuditsInput
    disconnect?: ItemWhereInput | boolean
    delete?: ItemWhereInput | boolean
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutAuditsInput, ItemUpdateWithoutAuditsInput>, ItemUncheckedUpdateWithoutAuditsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type ItemCreateWithoutCategoryInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    location?: LocationCreateNestedOneWithoutItemsInput
    parent?: ItemCreateNestedOneWithoutChildrenInput
    children?: ItemCreateNestedManyWithoutParentInput
    logs?: InventoryLogCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingCreateNestedManyWithoutItemInput
    audits?: ItemAuditCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutCategoryInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    children?: ItemUncheckedCreateNestedManyWithoutParentInput
    logs?: InventoryLogUncheckedCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput
    audits?: ItemAuditUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutCategoryInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutCategoryInput, ItemUncheckedCreateWithoutCategoryInput>
  }

  export type ItemCreateManyCategoryInputEnvelope = {
    data: ItemCreateManyCategoryInput | ItemCreateManyCategoryInput[]
  }

  export type ItemUpsertWithWhereUniqueWithoutCategoryInput = {
    where: ItemWhereUniqueInput
    update: XOR<ItemUpdateWithoutCategoryInput, ItemUncheckedUpdateWithoutCategoryInput>
    create: XOR<ItemCreateWithoutCategoryInput, ItemUncheckedCreateWithoutCategoryInput>
  }

  export type ItemUpdateWithWhereUniqueWithoutCategoryInput = {
    where: ItemWhereUniqueInput
    data: XOR<ItemUpdateWithoutCategoryInput, ItemUncheckedUpdateWithoutCategoryInput>
  }

  export type ItemUpdateManyWithWhereWithoutCategoryInput = {
    where: ItemScalarWhereInput
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyWithoutCategoryInput>
  }

  export type ItemScalarWhereInput = {
    AND?: ItemScalarWhereInput | ItemScalarWhereInput[]
    OR?: ItemScalarWhereInput[]
    NOT?: ItemScalarWhereInput | ItemScalarWhereInput[]
    id?: StringFilter<"Item"> | string
    name?: StringFilter<"Item"> | string
    inventoryCode?: StringNullableFilter<"Item"> | string | null
    categoryId?: StringFilter<"Item"> | string
    type?: StringFilter<"Item"> | string
    stock?: IntFilter<"Item"> | number
    minStock?: IntFilter<"Item"> | number
    unit?: StringFilter<"Item"> | string
    status?: StringFilter<"Item"> | string
    statusDetails?: StringNullableFilter<"Item"> | string | null
    locationId?: StringNullableFilter<"Item"> | string | null
    aisle?: StringNullableFilter<"Item"> | string | null
    shelf?: StringNullableFilter<"Item"> | string | null
    bin?: StringNullableFilter<"Item"> | string | null
    assignedTo?: StringNullableFilter<"Item"> | string | null
    imageUrl?: StringNullableFilter<"Item"> | string | null
    isApprovalRequired?: BoolFilter<"Item"> | boolean
    isKit?: BoolFilter<"Item"> | boolean
    nextMaintenanceDate?: DateTimeNullableFilter<"Item"> | Date | string | null
    parentId?: StringNullableFilter<"Item"> | string | null
    lastUpdated?: DateTimeFilter<"Item"> | Date | string
    createdAt?: DateTimeFilter<"Item"> | Date | string
  }

  export type ItemCreateWithoutLocationInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutItemsInput
    parent?: ItemCreateNestedOneWithoutChildrenInput
    children?: ItemCreateNestedManyWithoutParentInput
    logs?: InventoryLogCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingCreateNestedManyWithoutItemInput
    audits?: ItemAuditCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutLocationInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    children?: ItemUncheckedCreateNestedManyWithoutParentInput
    logs?: InventoryLogUncheckedCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput
    audits?: ItemAuditUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutLocationInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput>
  }

  export type ItemCreateManyLocationInputEnvelope = {
    data: ItemCreateManyLocationInput | ItemCreateManyLocationInput[]
  }

  export type ItemUpsertWithWhereUniqueWithoutLocationInput = {
    where: ItemWhereUniqueInput
    update: XOR<ItemUpdateWithoutLocationInput, ItemUncheckedUpdateWithoutLocationInput>
    create: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput>
  }

  export type ItemUpdateWithWhereUniqueWithoutLocationInput = {
    where: ItemWhereUniqueInput
    data: XOR<ItemUpdateWithoutLocationInput, ItemUncheckedUpdateWithoutLocationInput>
  }

  export type ItemUpdateManyWithWhereWithoutLocationInput = {
    where: ItemScalarWhereInput
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyWithoutLocationInput>
  }

  export type CategoryCreateWithoutItemsInput = {
    id?: string
    name: string
    description?: string | null
    color?: string | null
    icon?: string | null
    isActive?: boolean
  }

  export type CategoryUncheckedCreateWithoutItemsInput = {
    id?: string
    name: string
    description?: string | null
    color?: string | null
    icon?: string | null
    isActive?: boolean
  }

  export type CategoryCreateOrConnectWithoutItemsInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutItemsInput, CategoryUncheckedCreateWithoutItemsInput>
  }

  export type LocationCreateWithoutItemsInput = {
    id?: string
    name: string
  }

  export type LocationUncheckedCreateWithoutItemsInput = {
    id?: string
    name: string
  }

  export type LocationCreateOrConnectWithoutItemsInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
  }

  export type ItemCreateWithoutChildrenInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutItemsInput
    location?: LocationCreateNestedOneWithoutItemsInput
    parent?: ItemCreateNestedOneWithoutChildrenInput
    logs?: InventoryLogCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingCreateNestedManyWithoutItemInput
    audits?: ItemAuditCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutChildrenInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    logs?: InventoryLogUncheckedCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput
    audits?: ItemAuditUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutChildrenInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutChildrenInput, ItemUncheckedCreateWithoutChildrenInput>
  }

  export type ItemCreateWithoutParentInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutItemsInput
    location?: LocationCreateNestedOneWithoutItemsInput
    children?: ItemCreateNestedManyWithoutParentInput
    logs?: InventoryLogCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingCreateNestedManyWithoutItemInput
    audits?: ItemAuditCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutParentInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    children?: ItemUncheckedCreateNestedManyWithoutParentInput
    logs?: InventoryLogUncheckedCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput
    audits?: ItemAuditUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutParentInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutParentInput, ItemUncheckedCreateWithoutParentInput>
  }

  export type ItemCreateManyParentInputEnvelope = {
    data: ItemCreateManyParentInput | ItemCreateManyParentInput[]
  }

  export type InventoryLogCreateWithoutItemInput = {
    id?: string
    workerId?: string | null
    action: string
    quantity: number
    balance?: number
    notes?: string | null
    timestamp?: Date | string
  }

  export type InventoryLogUncheckedCreateWithoutItemInput = {
    id?: string
    workerId?: string | null
    action: string
    quantity: number
    balance?: number
    notes?: string | null
    timestamp?: Date | string
  }

  export type InventoryLogCreateOrConnectWithoutItemInput = {
    where: InventoryLogWhereUniqueInput
    create: XOR<InventoryLogCreateWithoutItemInput, InventoryLogUncheckedCreateWithoutItemInput>
  }

  export type InventoryLogCreateManyItemInputEnvelope = {
    data: InventoryLogCreateManyItemInput | InventoryLogCreateManyItemInput[]
  }

  export type InventoryBorrowingCreateWithoutItemInput = {
    id?: string
    quantity?: number
    borrowerId: string
    borrowerName: string
    borrowerEmail?: string | null
    borrowedAt?: Date | string
    dueDate?: Date | string | null
    returnedAt?: Date | string | null
    status?: string
    checkoutNotes?: string | null
    checkoutCondition?: string | null
    checkoutChecklist?: string | null
    returnNotes?: string | null
    returnCondition?: string | null
    returnChecklist?: string | null
    returnPhotos?: string | null
  }

  export type InventoryBorrowingUncheckedCreateWithoutItemInput = {
    id?: string
    quantity?: number
    borrowerId: string
    borrowerName: string
    borrowerEmail?: string | null
    borrowedAt?: Date | string
    dueDate?: Date | string | null
    returnedAt?: Date | string | null
    status?: string
    checkoutNotes?: string | null
    checkoutCondition?: string | null
    checkoutChecklist?: string | null
    returnNotes?: string | null
    returnCondition?: string | null
    returnChecklist?: string | null
    returnPhotos?: string | null
  }

  export type InventoryBorrowingCreateOrConnectWithoutItemInput = {
    where: InventoryBorrowingWhereUniqueInput
    create: XOR<InventoryBorrowingCreateWithoutItemInput, InventoryBorrowingUncheckedCreateWithoutItemInput>
  }

  export type InventoryBorrowingCreateManyItemInputEnvelope = {
    data: InventoryBorrowingCreateManyItemInput | InventoryBorrowingCreateManyItemInput[]
  }

  export type ItemAuditCreateWithoutItemInput = {
    id?: string
    itemName: string
    userId?: string | null
    userName?: string | null
    action: string
    changes?: string | null
    timestamp?: Date | string
  }

  export type ItemAuditUncheckedCreateWithoutItemInput = {
    id?: string
    itemName: string
    userId?: string | null
    userName?: string | null
    action: string
    changes?: string | null
    timestamp?: Date | string
  }

  export type ItemAuditCreateOrConnectWithoutItemInput = {
    where: ItemAuditWhereUniqueInput
    create: XOR<ItemAuditCreateWithoutItemInput, ItemAuditUncheckedCreateWithoutItemInput>
  }

  export type ItemAuditCreateManyItemInputEnvelope = {
    data: ItemAuditCreateManyItemInput | ItemAuditCreateManyItemInput[]
  }

  export type CategoryUpsertWithoutItemsInput = {
    update: XOR<CategoryUpdateWithoutItemsInput, CategoryUncheckedUpdateWithoutItemsInput>
    create: XOR<CategoryCreateWithoutItemsInput, CategoryUncheckedCreateWithoutItemsInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutItemsInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutItemsInput, CategoryUncheckedUpdateWithoutItemsInput>
  }

  export type CategoryUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type CategoryUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
  }

  export type LocationUpsertWithoutItemsInput = {
    update: XOR<LocationUpdateWithoutItemsInput, LocationUncheckedUpdateWithoutItemsInput>
    create: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutItemsInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutItemsInput, LocationUncheckedUpdateWithoutItemsInput>
  }

  export type LocationUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type LocationUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type ItemUpsertWithoutChildrenInput = {
    update: XOR<ItemUpdateWithoutChildrenInput, ItemUncheckedUpdateWithoutChildrenInput>
    create: XOR<ItemCreateWithoutChildrenInput, ItemUncheckedCreateWithoutChildrenInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutChildrenInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutChildrenInput, ItemUncheckedUpdateWithoutChildrenInput>
  }

  export type ItemUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutItemsNestedInput
    location?: LocationUpdateOneWithoutItemsNestedInput
    parent?: ItemUpdateOneWithoutChildrenNestedInput
    logs?: InventoryLogUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    logs?: InventoryLogUncheckedUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUpsertWithWhereUniqueWithoutParentInput = {
    where: ItemWhereUniqueInput
    update: XOR<ItemUpdateWithoutParentInput, ItemUncheckedUpdateWithoutParentInput>
    create: XOR<ItemCreateWithoutParentInput, ItemUncheckedCreateWithoutParentInput>
  }

  export type ItemUpdateWithWhereUniqueWithoutParentInput = {
    where: ItemWhereUniqueInput
    data: XOR<ItemUpdateWithoutParentInput, ItemUncheckedUpdateWithoutParentInput>
  }

  export type ItemUpdateManyWithWhereWithoutParentInput = {
    where: ItemScalarWhereInput
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyWithoutParentInput>
  }

  export type InventoryLogUpsertWithWhereUniqueWithoutItemInput = {
    where: InventoryLogWhereUniqueInput
    update: XOR<InventoryLogUpdateWithoutItemInput, InventoryLogUncheckedUpdateWithoutItemInput>
    create: XOR<InventoryLogCreateWithoutItemInput, InventoryLogUncheckedCreateWithoutItemInput>
  }

  export type InventoryLogUpdateWithWhereUniqueWithoutItemInput = {
    where: InventoryLogWhereUniqueInput
    data: XOR<InventoryLogUpdateWithoutItemInput, InventoryLogUncheckedUpdateWithoutItemInput>
  }

  export type InventoryLogUpdateManyWithWhereWithoutItemInput = {
    where: InventoryLogScalarWhereInput
    data: XOR<InventoryLogUpdateManyMutationInput, InventoryLogUncheckedUpdateManyWithoutItemInput>
  }

  export type InventoryLogScalarWhereInput = {
    AND?: InventoryLogScalarWhereInput | InventoryLogScalarWhereInput[]
    OR?: InventoryLogScalarWhereInput[]
    NOT?: InventoryLogScalarWhereInput | InventoryLogScalarWhereInput[]
    id?: StringFilter<"InventoryLog"> | string
    itemId?: StringFilter<"InventoryLog"> | string
    workerId?: StringNullableFilter<"InventoryLog"> | string | null
    action?: StringFilter<"InventoryLog"> | string
    quantity?: IntFilter<"InventoryLog"> | number
    balance?: IntFilter<"InventoryLog"> | number
    notes?: StringNullableFilter<"InventoryLog"> | string | null
    timestamp?: DateTimeFilter<"InventoryLog"> | Date | string
  }

  export type InventoryBorrowingUpsertWithWhereUniqueWithoutItemInput = {
    where: InventoryBorrowingWhereUniqueInput
    update: XOR<InventoryBorrowingUpdateWithoutItemInput, InventoryBorrowingUncheckedUpdateWithoutItemInput>
    create: XOR<InventoryBorrowingCreateWithoutItemInput, InventoryBorrowingUncheckedCreateWithoutItemInput>
  }

  export type InventoryBorrowingUpdateWithWhereUniqueWithoutItemInput = {
    where: InventoryBorrowingWhereUniqueInput
    data: XOR<InventoryBorrowingUpdateWithoutItemInput, InventoryBorrowingUncheckedUpdateWithoutItemInput>
  }

  export type InventoryBorrowingUpdateManyWithWhereWithoutItemInput = {
    where: InventoryBorrowingScalarWhereInput
    data: XOR<InventoryBorrowingUpdateManyMutationInput, InventoryBorrowingUncheckedUpdateManyWithoutItemInput>
  }

  export type InventoryBorrowingScalarWhereInput = {
    AND?: InventoryBorrowingScalarWhereInput | InventoryBorrowingScalarWhereInput[]
    OR?: InventoryBorrowingScalarWhereInput[]
    NOT?: InventoryBorrowingScalarWhereInput | InventoryBorrowingScalarWhereInput[]
    id?: StringFilter<"InventoryBorrowing"> | string
    itemId?: StringFilter<"InventoryBorrowing"> | string
    quantity?: IntFilter<"InventoryBorrowing"> | number
    borrowerId?: StringFilter<"InventoryBorrowing"> | string
    borrowerName?: StringFilter<"InventoryBorrowing"> | string
    borrowerEmail?: StringNullableFilter<"InventoryBorrowing"> | string | null
    borrowedAt?: DateTimeFilter<"InventoryBorrowing"> | Date | string
    dueDate?: DateTimeNullableFilter<"InventoryBorrowing"> | Date | string | null
    returnedAt?: DateTimeNullableFilter<"InventoryBorrowing"> | Date | string | null
    status?: StringFilter<"InventoryBorrowing"> | string
    checkoutNotes?: StringNullableFilter<"InventoryBorrowing"> | string | null
    checkoutCondition?: StringNullableFilter<"InventoryBorrowing"> | string | null
    checkoutChecklist?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnNotes?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnCondition?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnChecklist?: StringNullableFilter<"InventoryBorrowing"> | string | null
    returnPhotos?: StringNullableFilter<"InventoryBorrowing"> | string | null
  }

  export type ItemAuditUpsertWithWhereUniqueWithoutItemInput = {
    where: ItemAuditWhereUniqueInput
    update: XOR<ItemAuditUpdateWithoutItemInput, ItemAuditUncheckedUpdateWithoutItemInput>
    create: XOR<ItemAuditCreateWithoutItemInput, ItemAuditUncheckedCreateWithoutItemInput>
  }

  export type ItemAuditUpdateWithWhereUniqueWithoutItemInput = {
    where: ItemAuditWhereUniqueInput
    data: XOR<ItemAuditUpdateWithoutItemInput, ItemAuditUncheckedUpdateWithoutItemInput>
  }

  export type ItemAuditUpdateManyWithWhereWithoutItemInput = {
    where: ItemAuditScalarWhereInput
    data: XOR<ItemAuditUpdateManyMutationInput, ItemAuditUncheckedUpdateManyWithoutItemInput>
  }

  export type ItemAuditScalarWhereInput = {
    AND?: ItemAuditScalarWhereInput | ItemAuditScalarWhereInput[]
    OR?: ItemAuditScalarWhereInput[]
    NOT?: ItemAuditScalarWhereInput | ItemAuditScalarWhereInput[]
    id?: StringFilter<"ItemAudit"> | string
    itemId?: StringNullableFilter<"ItemAudit"> | string | null
    itemName?: StringFilter<"ItemAudit"> | string
    userId?: StringNullableFilter<"ItemAudit"> | string | null
    userName?: StringNullableFilter<"ItemAudit"> | string | null
    action?: StringFilter<"ItemAudit"> | string
    changes?: StringNullableFilter<"ItemAudit"> | string | null
    timestamp?: DateTimeFilter<"ItemAudit"> | Date | string
  }

  export type ItemCreateWithoutLogsInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutItemsInput
    location?: LocationCreateNestedOneWithoutItemsInput
    parent?: ItemCreateNestedOneWithoutChildrenInput
    children?: ItemCreateNestedManyWithoutParentInput
    borrowings?: InventoryBorrowingCreateNestedManyWithoutItemInput
    audits?: ItemAuditCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutLogsInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    children?: ItemUncheckedCreateNestedManyWithoutParentInput
    borrowings?: InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput
    audits?: ItemAuditUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutLogsInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutLogsInput, ItemUncheckedCreateWithoutLogsInput>
  }

  export type ItemUpsertWithoutLogsInput = {
    update: XOR<ItemUpdateWithoutLogsInput, ItemUncheckedUpdateWithoutLogsInput>
    create: XOR<ItemCreateWithoutLogsInput, ItemUncheckedCreateWithoutLogsInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutLogsInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutLogsInput, ItemUncheckedUpdateWithoutLogsInput>
  }

  export type ItemUpdateWithoutLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutItemsNestedInput
    location?: LocationUpdateOneWithoutItemsNestedInput
    parent?: ItemUpdateOneWithoutChildrenNestedInput
    children?: ItemUpdateManyWithoutParentNestedInput
    borrowings?: InventoryBorrowingUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemUncheckedUpdateManyWithoutParentNestedInput
    borrowings?: InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateWithoutBorrowingsInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutItemsInput
    location?: LocationCreateNestedOneWithoutItemsInput
    parent?: ItemCreateNestedOneWithoutChildrenInput
    children?: ItemCreateNestedManyWithoutParentInput
    logs?: InventoryLogCreateNestedManyWithoutItemInput
    audits?: ItemAuditCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutBorrowingsInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    children?: ItemUncheckedCreateNestedManyWithoutParentInput
    logs?: InventoryLogUncheckedCreateNestedManyWithoutItemInput
    audits?: ItemAuditUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutBorrowingsInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutBorrowingsInput, ItemUncheckedCreateWithoutBorrowingsInput>
  }

  export type ItemUpsertWithoutBorrowingsInput = {
    update: XOR<ItemUpdateWithoutBorrowingsInput, ItemUncheckedUpdateWithoutBorrowingsInput>
    create: XOR<ItemCreateWithoutBorrowingsInput, ItemUncheckedCreateWithoutBorrowingsInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutBorrowingsInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutBorrowingsInput, ItemUncheckedUpdateWithoutBorrowingsInput>
  }

  export type ItemUpdateWithoutBorrowingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutItemsNestedInput
    location?: LocationUpdateOneWithoutItemsNestedInput
    parent?: ItemUpdateOneWithoutChildrenNestedInput
    children?: ItemUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutBorrowingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemUncheckedUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUncheckedUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateWithoutAuditsInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutItemsInput
    location?: LocationCreateNestedOneWithoutItemsInput
    parent?: ItemCreateNestedOneWithoutChildrenInput
    children?: ItemCreateNestedManyWithoutParentInput
    logs?: InventoryLogCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutAuditsInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
    children?: ItemUncheckedCreateNestedManyWithoutParentInput
    logs?: InventoryLogUncheckedCreateNestedManyWithoutItemInput
    borrowings?: InventoryBorrowingUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutAuditsInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutAuditsInput, ItemUncheckedCreateWithoutAuditsInput>
  }

  export type ItemUpsertWithoutAuditsInput = {
    update: XOR<ItemUpdateWithoutAuditsInput, ItemUncheckedUpdateWithoutAuditsInput>
    create: XOR<ItemCreateWithoutAuditsInput, ItemUncheckedCreateWithoutAuditsInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutAuditsInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutAuditsInput, ItemUncheckedUpdateWithoutAuditsInput>
  }

  export type ItemUpdateWithoutAuditsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutItemsNestedInput
    location?: LocationUpdateOneWithoutItemsNestedInput
    parent?: ItemUpdateOneWithoutChildrenNestedInput
    children?: ItemUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutAuditsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemUncheckedUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUncheckedUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateManyCategoryInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
  }

  export type ItemUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneWithoutItemsNestedInput
    parent?: ItemUpdateOneWithoutChildrenNestedInput
    children?: ItemUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemUncheckedUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUncheckedUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateManyWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCreateManyLocationInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    parentId?: string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
  }

  export type ItemUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutItemsNestedInput
    parent?: ItemUpdateOneWithoutChildrenNestedInput
    children?: ItemUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemUncheckedUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUncheckedUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateManyWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCreateManyParentInput = {
    id?: string
    name: string
    inventoryCode?: string | null
    categoryId: string
    type?: string
    stock?: number
    minStock?: number
    unit?: string
    status?: string
    statusDetails?: string | null
    locationId?: string | null
    aisle?: string | null
    shelf?: string | null
    bin?: string | null
    assignedTo?: string | null
    imageUrl?: string | null
    isApprovalRequired?: boolean
    isKit?: boolean
    nextMaintenanceDate?: Date | string | null
    lastUpdated?: Date | string
    createdAt?: Date | string
  }

  export type InventoryLogCreateManyItemInput = {
    id?: string
    workerId?: string | null
    action: string
    quantity: number
    balance?: number
    notes?: string | null
    timestamp?: Date | string
  }

  export type InventoryBorrowingCreateManyItemInput = {
    id?: string
    quantity?: number
    borrowerId: string
    borrowerName: string
    borrowerEmail?: string | null
    borrowedAt?: Date | string
    dueDate?: Date | string | null
    returnedAt?: Date | string | null
    status?: string
    checkoutNotes?: string | null
    checkoutCondition?: string | null
    checkoutChecklist?: string | null
    returnNotes?: string | null
    returnCondition?: string | null
    returnChecklist?: string | null
    returnPhotos?: string | null
  }

  export type ItemAuditCreateManyItemInput = {
    id?: string
    itemName: string
    userId?: string | null
    userName?: string | null
    action: string
    changes?: string | null
    timestamp?: Date | string
  }

  export type ItemUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutItemsNestedInput
    location?: LocationUpdateOneWithoutItemsNestedInput
    children?: ItemUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemUncheckedUpdateManyWithoutParentNestedInput
    logs?: InventoryLogUncheckedUpdateManyWithoutItemNestedInput
    borrowings?: InventoryBorrowingUncheckedUpdateManyWithoutItemNestedInput
    audits?: ItemAuditUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    inventoryCode?: NullableStringFieldUpdateOperationsInput | string | null
    categoryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    minStock?: IntFieldUpdateOperationsInput | number
    unit?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    statusDetails?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    aisle?: NullableStringFieldUpdateOperationsInput | string | null
    shelf?: NullableStringFieldUpdateOperationsInput | string | null
    bin?: NullableStringFieldUpdateOperationsInput | string | null
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    isApprovalRequired?: BoolFieldUpdateOperationsInput | boolean
    isKit?: BoolFieldUpdateOperationsInput | boolean
    nextMaintenanceDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastUpdated?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryLogUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    balance?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryLogUncheckedUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    balance?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryLogUncheckedUpdateManyWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    balance?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryBorrowingUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    borrowerId?: StringFieldUpdateOperationsInput | string
    borrowerName?: StringFieldUpdateOperationsInput | string
    borrowerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    borrowedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    returnedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutCondition?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnNotes?: NullableStringFieldUpdateOperationsInput | string | null
    returnCondition?: NullableStringFieldUpdateOperationsInput | string | null
    returnChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnPhotos?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type InventoryBorrowingUncheckedUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    borrowerId?: StringFieldUpdateOperationsInput | string
    borrowerName?: StringFieldUpdateOperationsInput | string
    borrowerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    borrowedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    returnedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutCondition?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnNotes?: NullableStringFieldUpdateOperationsInput | string | null
    returnCondition?: NullableStringFieldUpdateOperationsInput | string | null
    returnChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnPhotos?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type InventoryBorrowingUncheckedUpdateManyWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    borrowerId?: StringFieldUpdateOperationsInput | string
    borrowerName?: StringFieldUpdateOperationsInput | string
    borrowerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    borrowedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    returnedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutNotes?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutCondition?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnNotes?: NullableStringFieldUpdateOperationsInput | string | null
    returnCondition?: NullableStringFieldUpdateOperationsInput | string | null
    returnChecklist?: NullableStringFieldUpdateOperationsInput | string | null
    returnPhotos?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ItemAuditUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    changes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemAuditUncheckedUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    changes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemAuditUncheckedUpdateManyWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    action?: StringFieldUpdateOperationsInput | string
    changes?: NullableStringFieldUpdateOperationsInput | string | null
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use CategoryCountOutputTypeDefaultArgs instead
     */
    export type CategoryCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CategoryCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LocationCountOutputTypeDefaultArgs instead
     */
    export type LocationCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LocationCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ItemCountOutputTypeDefaultArgs instead
     */
    export type ItemCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ItemCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CategoryDefaultArgs instead
     */
    export type CategoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CategoryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LocationDefaultArgs instead
     */
    export type LocationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LocationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ItemDefaultArgs instead
     */
    export type ItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use InventoryLogDefaultArgs instead
     */
    export type InventoryLogArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = InventoryLogDefaultArgs<ExtArgs>
    /**
     * @deprecated Use InventoryBorrowingDefaultArgs instead
     */
    export type InventoryBorrowingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = InventoryBorrowingDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SettingDefaultArgs instead
     */
    export type SettingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SettingDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ItemAuditDefaultArgs instead
     */
    export type ItemAuditArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ItemAuditDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}