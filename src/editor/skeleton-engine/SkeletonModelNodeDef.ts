import Class from '../../common/type/Class';
import SkeletonModelNodeComponent from './SkeletonModelNodeComponent';

export default abstract class SkeletonModelNodeDef {
    abstract name: string;
    abstract label: string;
    abstract components: Class<SkeletonModelNodeComponent<any>>[];
    abstract validChildTypes: string[];
    defaultValues: { [key: string]: any } = {};
}