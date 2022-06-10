export default abstract class UpdateSystem<T> {

    protected subSystems: UpdateSystem<T>[] = [];

    abstract begin(engine: T): void;

    abstract end(engine: T): void;

    sub(...systems: UpdateSystem<T>[]) {
        this.subSystems.push(...systems);
        return this;
    }

    update(engine: T) {
        this.begin(engine);
        for (let sub of this.subSystems) {
            sub.update(engine);
        }
        this.end(engine);
    }

}
