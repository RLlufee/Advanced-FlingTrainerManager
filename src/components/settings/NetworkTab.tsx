import React from "react";
import { NetworkSettings, NetworkTestResult } from "../../services/configApi";
import { PaperContainer } from "../ui/motion/PaperFlutter";
import {
  ProxyConfigCard,
  UpdateSourceCard,
  SteamCdnCard,
  TimeoutRetryCard,
} from "./network";

export interface NetworkTabProps {
  network: NetworkSettings;
  testResult: NetworkTestResult | null;
  isTestingNetwork: boolean;
  testTarget: string;
  onUpdateNetwork: (partial: Partial<NetworkSettings>) => void;
  onTestNetwork: () => void;
  onTestTargetChange: (target: string) => void;
  onResetNetwork: () => void;
}

export const NetworkTab: React.FC<NetworkTabProps> = ({
  network,
  testResult,
  isTestingNetwork,
  testTarget,
  onUpdateNetwork,
  onTestNetwork,
  onTestTargetChange,
  onResetNetwork,
}) => {
  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 卡片 1: 本地网络代理配置与连通性诊断 */}
      <ProxyConfigCard
        network={network}
        testResult={testResult}
        isTestingNetwork={isTestingNetwork}
        testTarget={testTarget}
        onUpdateNetwork={onUpdateNetwork}
        onTestNetwork={onTestNetwork}
        onTestTargetChange={onTestTargetChange}
      />

      {/* 卡片 2: 更新源与 GitHub 镜像加速 */}
      <UpdateSourceCard
        updateSource={network.update_source}
        onUpdateSource={(source) => onUpdateNetwork({ update_source: source })}
      />

      {/* 卡片 3: Steam 官方海报 CDN 加速 */}
      <SteamCdnCard
        enableSteamCdn={network.enable_steam_cdn}
        steamCdnHost={network.steam_cdn_host}
        onUpdateNetwork={onUpdateNetwork}
      />

      {/* 卡片 4: 网络超时与容错微调 */}
      <TimeoutRetryCard
        timeoutMs={network.timeout_ms}
        maxRetryCount={network.max_retry_count}
        onUpdateNetwork={onUpdateNetwork}
        onResetNetwork={onResetNetwork}
      />
    </PaperContainer>
  );
};
