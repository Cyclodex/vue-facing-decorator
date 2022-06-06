import { defineComponent } from 'vue';
import { obtainSlot, extendSlotPath } from './utils'
import { build as optionComputed } from './option/computed'
import { build as optionData } from './option/data'
import { build as optionMethodsAndLifecycle } from './option/methodsAndLifecycle'
import { build as optionRef } from './option/ref'
import { build as optionWatch, WatchConfig } from './option/watch'
import { build as optionProps, PropsConfig } from './option/props'
import { build as optionInject, InjectConfig } from './option/inject'
import { build as optionEmit } from './option/emit'
export interface OptionBuilder {
    name?: string
    data?: Record<string, any>
    methods?: Record<string, Function>
    lifecycle?: Record<string, Function>
    computed?: Record<string, any>
    watch?: Record<string, WatchConfig>
    props?: Record<string, PropsConfig>
    inject?: Record<string, InjectConfig>

}
export interface Cons { new(): any, prototype: any }
function ComponentOption(cons: Cons, extend?: any) {
    const optionBuilder: OptionBuilder = {}
    optionComputed(cons, optionBuilder)
    optionWatch(cons, optionBuilder)
    optionProps(cons, optionBuilder)
    optionInject(cons, optionBuilder)
    optionEmit(cons, optionBuilder)
    optionMethodsAndLifecycle(cons, optionBuilder)
    optionRef(cons, optionBuilder)

    const raw = {
        data() {
            const optionBuilder: OptionBuilder = {}
            optionData(cons, optionBuilder)
            return optionBuilder.data ?? {}
        },
        methods: optionBuilder.methods,
        computed: optionBuilder.computed,
        watch: optionBuilder.watch,
        props: optionBuilder.props,
        inject: optionBuilder.inject,
        ...optionBuilder.lifecycle,
        extends: extend
    }
    return raw as any
}

type ComponentOption = {
    name?: string
    emits?: string[]
    provide?: Record<string, any> | Function
    components?: Record<string, any>
    directives?: Record<string, any>;
    inheritAttrs?: true;
    expose?: string[];
    modifier?: (raw: any) => any
}
type ComponentConsOption = Cons | ComponentOption
function ComponentStep(cons: Cons, extend?: any) {
    return defineComponent(ComponentOption(cons, extend))
}

function ComponentStepWithOption(cons: Cons, arg: ComponentOption, extend?: any): any {
    let option = ComponentOption(cons, extend)
    const slot = obtainSlot(cons.prototype)
    if (typeof arg.name !== 'undefined') {
        option.name = arg.name
    }

    let emits = Array.from(slot.obtainMap('emits').keys())
    if (Array.isArray(arg.emits)) {
        emits = Array.from(new Set([...emits, ...arg.emits]))
    }
    option.emits = emits


    if (arg.components) {
        option.components = arg.components
    }
    if (arg.provide) {
        option.provide = arg.provide
    }
    if (arg.directives) {
        option.directives = arg.directives
    }
    if (arg.inheritAttrs) {
        option.inheritAttrs = arg.inheritAttrs
    }
    if (arg.expose) {
        option.expose = arg.expose
    }

    if (arg.modifier) {
        option = arg.modifier(option)
        if (!option) {
            throw 'Component modifier should return vue component option'
        }
    }
    return defineComponent(option)
}

export function ComponentBase(cons: Cons) {
    const slot = obtainSlot(cons.prototype)
    slot.inComponent = true
    return cons
}

export function Component(arg: Cons|ComponentOption) {

    function extend(cons: Cons) {
        ComponentBase(cons)
        const slotPath = extendSlotPath(cons.prototype)

        slotPath.forEach(proto => {
            const slot = obtainSlot(proto)
            if (!slot.inComponent) {
                throw 'Class should be decorated by Component or ComponentBase: ' + proto.constructor
            }
        })

        return slotPath.reduceRight<any>((pv, cv, ci) => {
            if (ci > 0) {
                return ComponentStep(cv.constructor, pv === null ? undefined : pv)
            } else {

                if (typeof arg === 'function') {
                    return ComponentStepWithOption(cv.constructor, {}, pv === null ? undefined : pv)
                } else {
                    return ComponentStepWithOption(cv.constructor, arg, pv === null ? undefined : pv)
                }
            }
        }, null)
    }
    if (typeof arg === 'function') {

        const finalComp = extend(arg)
        return finalComp
    }
    return function (cons: Cons) {

        const finalComp = extend(cons)

        return finalComp
    }
}