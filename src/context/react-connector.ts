import { lazy, Lazy } from '../utilities';

// credit to ffz devs <3

export class ReactConnector {
  protected known = new Map<string, ReactNode>();
  protected reactRoot: Lazy<ReactNode> = lazy(() => (document.querySelector('#root') as any)?._reactRootContainer?._internalRoot?.current);

  find<T extends ReactNode>(id: string, constraint: (node: ReactNodeMaybe<T>) => any, bypassCache = false): T | null {
    if(!bypassCache && this.known.has(id)) return this.known.get(id) as T;
    const found = this.findNode(this.reactRoot(), constraint);
    if(!bypassCache && found) this.known.set(id, found);

    return found;
  }

  protected findNode<T extends ReactNode>(root: ReactNode | null, constraint: (node: ReactNodeMaybe<T>) => any): T | null {
    if(!root) return null;
    if(root.stateNode && constraint(root.stateNode as ReactNodeMaybe<T>)) return root.stateNode as T;

    let node = root.child;
    while(node) {
      const result = this.findNode(node, constraint);
      if (result) return result;

      node = node.sibling;
    }

    return null;
  }
}

export interface ReactNode {
  child: ReactNode | null;
  sibling: ReactNode | null;
  current?: ReactNode;
  stateNode?: ReactNode & {props?: {root?: ReactNode}};
}

export type ReactNodeMaybe<T extends ReactNode> = ReactNode & Partial<T>;
