import React from 'react';
import ReactDOM from 'react-dom';
import { Node } from './Node';

function install(editor, { component: NodeComponent = Node, createRoot }) {
    const roots = new Map()
    const render = createRoot ? (element, container) => {
        if (!roots.has(container)) roots.set(container, createRoot(container))
        const root = roots.get(container)

        root.render(element)
    } : ReactDOM.render

    editor.on('rendernode', ({ el, node, component, bindSocket, bindControl }) => {
        if (component.render && component.render !== 'react') return;
        const Component = component.component || NodeComponent;

        node.update = () => new Promise((res) => {
            render(<Component node={node} editor={editor} bindSocket={bindSocket} bindControl={bindControl} />, el, res)
        });
        node._reactComponent = true;
        node.update();
    });

    editor.on('rendercontrol', ({ el, control }) => {
        if (control.render && control.render !== 'react') return;
        const Component = control.component;

        control.update = () => new Promise((res) => {
            render(<Component {...control.props} />, el, res)
        });
        control.update();
    });

    editor.on('connectioncreated connectionremoved', connection => {
        connection.output.node.update();
        connection.input.node.update();
    });

    let previousSelected = []

    editor.on('nodeselected', (node) => {
        const selected = [...editor.selected.list]

        previousSelected
            .filter(n => !selected.includes(n))
            .filter(n => n._reactComponent)
            .forEach(n => n.update())
        if (node._reactComponent) node.update()
        previousSelected = selected
    });
}

export { Node } from './Node';
export { Socket } from './Socket';
export { Control } from './Control';

export default {
    name: 'react-render',
    install
}
