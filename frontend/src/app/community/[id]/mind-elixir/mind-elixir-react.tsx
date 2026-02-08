"use client";

import MindElixir from "@/lib/mind-elixir-import";
import type {
    MindElixirData,
    MindElixirInstance,
    Options as MindElixirOptions,
    NodeObj,
} from "mind-elixir";
import { forwardRef, memo, useEffect, useRef } from "react";

// The example mind-elixir React component, which will be wrapped by the MindElixirComponent
// to integrate it with the posts system

type Plugin = (instance: MindElixirInstance) => void;
type OperationHandler = (node: NodeObj) => void;

export interface Props {
    className: string;
    style?: React.CSSProperties;
    data: MindElixirData;
    options: Partial<MindElixirOptions>;
    plugins: Array<Plugin>;
}

function MindElixirReact(
    { className, style, data, options, plugins }: Props,
    ref: React.ForwardedRef<{ instance: MindElixirInstance } & HTMLDivElement>,
) {
    const isInitialized = useRef(false);
    const lastData = useRef<object | null>(null);

    useEffect(() => {
        if (
            ref &&
            typeof ref === "object" &&
            "current" in ref &&
            ref.current &&
            !isInitialized.current
        ) {
            const me = new MindElixir({
                ...options,
                el: ref.current,
            });

            if (plugins && plugins.length > 0)
                for (let i = 0; i < plugins.length; i++) {
                    const plugin = plugins[i];
                    me.install(plugin);
                }

            me.init(data);

            ref.current.instance = me;
            isInitialized.current = true;
            lastData.current = data;

            me.toCenter();
        }
    }, []);

    useEffect(() => {
        if (
            ref &&
            typeof ref === "object" &&
            "current" in ref &&
            ref.current &&
            ref.current.instance &&
            isInitialized.current &&
            data !== lastData.current
        ) {
            const me = ref.current.instance;
            me.refresh(data);
            lastData.current = data;
        }
    }, [data]);

    return <div ref={ref as any} className={className} style={style}></div>;
}

export default memo(
    forwardRef<{ instance: MindElixirInstance } & HTMLDivElement, Props>(
        MindElixirReact,
    ),
);
