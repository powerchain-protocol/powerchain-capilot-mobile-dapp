import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../ui/Button";
import { PowerChainLogo } from "../brand/Logo";

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("PowerChain application error", error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.base}>
        <PowerChainLogo size={48} variant="green" />
        <Text style={styles.title}>PowerChain could not continue</Text>
        <Text style={styles.description}>
          An unexpected application error occurred. Your wallet private keys are
          not managed by PowerChain.
        </Text>
        <Button label="Try again" onPress={this.reset} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 12,
    padding: 24,
    backgroundColor: "#F7F8F7",
  },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    color: "#101412",
  },
  description: {
    maxWidth: 520,
    fontSize: 15,
    lineHeight: 22,
    color: "#66706B",
  },
});
