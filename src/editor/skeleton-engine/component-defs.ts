import {Component} from 'vue';
import Class from '../../common/type/Class';
import SkeletonModelNode from './SkeletonModelNode';
import SkeletonModelNodeComponent from './SkeletonModelNodeComponent';

type SkeletonModelNodeComponentRegisterInfo = {
    constructor: Class<SkeletonModelNodeComponent<any>>;
    storable?: boolean;
    cloneable?: boolean;
    label?: string;
    inputComponent?: Component;
    flipFunc?: (val: any, node: SkeletonModelNode) => any;
    interpFunc?: (a: any, b: any, t: number) => any;
    serializeFunc?: (val: any) => any;
    deserializeFunc?: (val: any) => any;
};

export const skeletonModelComponentDefs: { [name: string]: SkeletonModelNodeComponentRegisterInfo } = {};

export function registerSkeletonModelComponentDef(params: {
    storable?: boolean;
    cloneable?: boolean;
    label?: string;
    inputComponent?: Component;
    flipFunc?: (val: any, node: SkeletonModelNode) => any;
    interpFunc?: (a: any, b: any, t: number) => any;
    serializeFunc?: (val: any) => any;
    deserializeFunc?: (val: any) => any;
} = {}) {
    return function (constructor: Class<SkeletonModelNodeComponent<any>>) {
        skeletonModelComponentDefs[constructor.name] = Object.assign({constructor}, params) as SkeletonModelNodeComponentRegisterInfo;
    };
}
