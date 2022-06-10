import {ReadonlyMat4} from 'gl-matrix';
import {toRaw} from 'vue';
import Class from '../../common/type/Class';
import WorldMatrix from './components/WorldMatrix';
import SkeletonModelNodeComponent from './SkeletonModelNodeComponent';

const UNIT_MAT4: ReadonlyMat4 = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

export default class SkeletonModelNode {

    id: number = 0;
    type: string = '';
    expanded: boolean = true;
    components: { [name: string]: SkeletonModelNodeComponent<any> } = {};
    parent: SkeletonModelNode | null = null;
    children: SkeletonModelNode[] = [];

    getComponent<T extends SkeletonModelNodeComponent<any>>(componentClass: Class<T>): T | undefined {
        return this.components[componentClass.name] as T;
    }

    getComponentAssert<T extends SkeletonModelNodeComponent<any>>(componentClass: Class<T>): T {
        const component = this.components[componentClass.name] as T;
        if (!component) {
            throw new Error(`Failed to get component [${componentClass.name}]`);
        }
        return component;
    }

    getValue<T>(componentClass: Class<SkeletonModelNodeComponent<T>>): T {
        return toRaw(this.getComponentAssert(componentClass).value);
    }

    getValueOrElse<T>(componentClass: Class<SkeletonModelNodeComponent<T>>, defaultValue: T): T {
        const component = this.getComponent(componentClass);
        return component ? component.value : defaultValue;
    }

    getWorldMatrix(): ReadonlyMat4 {
        for (let node: SkeletonModelNode | null = this; node; node = node.parent) {
            const worldMatrix = node.getComponent(WorldMatrix);
            if (worldMatrix) {
                return worldMatrix.value;
            }
        }
        return UNIT_MAT4;
    }

    getParentWorldMatrix(): ReadonlyMat4 {
        return this.parent ? this.parent.getWorldMatrix() : UNIT_MAT4;
    }

}