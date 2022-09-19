
export { Component, ComponentBase } from './component'
export { decorator as Ref } from './option/ref'
export { decorator as Watch } from './option/watch'
export { decorator as Prop } from './option/props'
export { decorator as Inject } from './option/inject'
export { decorator as Emit } from './option/emit'
export { decorator as VModel, decorator as Model } from './option/vmodel'
export { decorator as Vanilla } from './option/vanilla'
export { decorator as Hook } from './option/methodsAndHooks'

import {
    ComponentPublicInstance,
    defineComponent
} from 'vue'
const IdentifySymbol = Symbol('vue-facing-decorator-identify')
export interface BaseTypeIdentify {
    [IdentifySymbol]: undefined
}
export function TSX<Properties extends {} = {}, Events extends {} = {}>() {


    type Bundle = Properties & { [index in keyof Events as `on${Capitalize<index & string>}`]: Events[index] extends Function ? Events[index] : { (param: Events[index]): any } }
    return function <C extends { new(): ComponentPublicInstance & BaseTypeIdentify }>(cons: C) {
        return cons as unknown as {
            new(): Omit<ComponentPublicInstance<(InstanceType<C>['$props']) & Bundle>, keyof Bundle> & InstanceType<C>//& ComponentPublicInstance & BaseTypeIdentify
        }
    }
}

export const Base = class { } as {
    new(): ComponentPublicInstance & BaseTypeIdentify
}
export const Vue = Base

export function options<T extends (typeof Vue) | Object>(data: (T & { __vccOpts?: any })) {


    type C = T extends typeof Vue ?
        {
            data: { [index in keyof InstanceType<T> as InstanceType<T>[index] extends Function ? never : index]: InstanceType<T>[index]

            }
            methods: { [index in keyof InstanceType<T> as InstanceType<T>[index] extends Function ? index : never]: InstanceType<T>[index] }

        }
        : any

    let opt: any = data
    if (typeof data === 'function' && data.prototype instanceof Vue && '__vccOpts' in data) {
        opt = data['__vccOpts']
    }
    return defineComponent<any,any,C['data'],any,C['methods'],any,any,any,any>(opt as C)
}