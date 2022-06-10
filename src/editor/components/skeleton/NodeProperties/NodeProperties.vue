<template>
    <div class="properties"
         :key="node.id"
    >
        <h4>{{ node.type }} #{{ node.id }}</h4>
        <template v-for="(entityComponent, type) in components">
            <div class="property"
                 v-if="skeletonModelComponentDefs[type]?.inputComponent"
            >
                <label>{{ skeletonModelComponentDefs[type].label || type }}</label>
                <component class="value"
                           :is="skeletonModelComponentDefs[type].inputComponent"
                           :value="entityComponent.value"
                           @input="onInput(type, $event)"
                           @wait-for-post="onWaitForPost(type, $event)"
                />
            </div>
        </template>
    </div>
</template>

<script src="./NodeProperties.ts"></script>