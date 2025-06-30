import React, { useContext } from "react";
import type { ComponentType, PropsWithChildren, Context } from "react";

export function MapProviderToProps<
  ComponentProps extends object,
  ProviderProps extends object
>(input: {
  Component: ComponentType<ComponentProps>;
  Provider: ComponentType<PropsWithChildren<ProviderProps>>;
  Context: Context<ComponentProps>;
}) {
  const { Component, Provider, Context } = input;
  function ComponentWithContext() {
    const props = useContext(Context);
    return <Component {...props} />;
  }
  return function ComponentWithProvider(props: ProviderProps) {
    return (
      <Provider {...props}>
        <ComponentWithContext />
      </Provider>
    );
  };
}
