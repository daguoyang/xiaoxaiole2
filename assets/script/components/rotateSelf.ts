import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('rotateSelf')
export class rotateSelf extends Component {
    start() {

    }

    update(deltaTime: number) {
        this.node.angle--;
    }
}


