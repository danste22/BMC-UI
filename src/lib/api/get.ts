import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { useAxiosWithAuth } from "./_core";
import { type APIResponse } from "./types";

interface USBTabResponse {
  bus_type: "Single bus" | "Usb hub";
  mode: "Host" | "Device" | "Flash";
  /** Node name as sent by bmcd, e.g. "Node 3". Parse with parseNodeNumber. */
  node: string;
  route: "Bmc" | "AlternativePort";
}

interface PowerTabResponse {
  node1: "0" | "1";
  node2: "0" | "1";
  node3: "0" | "1";
  node4: "0" | "1";
}

interface AboutTabResponse {
  board_model: string;
  board_revision: string;
  hostname: string;
  api: string;
  /** BMC firmware version (from os-release VERSION). */
  version: string;
  /** bmcd daemon version (Cargo package version). */
  bmcd_version: string;
  buildtime: Date;
  buildroot: string;
}

export interface FlashStatus {
  Transferring?: {
    id: number;
    process_name: string;
    size: number;
    cancelled: boolean;
    bytes_written: number;
  };
  Done?: [{ secs: number; nanos: number }, number];
  Error?: string;
}

interface InfoTabResponse {
  ip: { device: string; ip: string; mac: string }[];
  storage: { name: string; total_bytes: number; bytes_free: number }[];
}

interface CoolingDevice {
  device: string;
  max_speed: number;
  speed: number;
}

export interface NodeInfoResponse {
  module_name: string | null;
  name: string | null;
  power_on_time: number | null;
  uart_baud: string | null;
}

export function useUSBTabData() {
  const api = useAxiosWithAuth();

  return useSuspenseQuery({
    queryKey: ["usbTabData"],
    queryFn: async () => {
      const response = await api.get<APIResponse<USBTabResponse[]>>("/bmc", {
        params: {
          opt: "get",
          type: "usb",
        },
      });
      return response.data.response[0].result[0];
    },
  });
}

export function usePowerTabData() {
  const api = useAxiosWithAuth();

  return useSuspenseQuery({
    queryKey: ["powerTabData"],
    queryFn: async () => {
      const response = await api.get<APIResponse<PowerTabResponse>>("/bmc", {
        params: {
          opt: "get",
          type: "power",
        },
      });
      return response.data.response[0].result;
    },
  });
}

export function useAboutTabData() {
  const api = useAxiosWithAuth();

  return useSuspenseQuery({
    queryKey: ["aboutTabData"],
    staleTime: 1000 * 60 * 60, // Valid for 1 hour
    queryFn: async () => {
      const response = await api.get<APIResponse<AboutTabResponse>>("/bmc", {
        params: {
          opt: "get",
          type: "about",
        },
      });
      return {
        ...response.data.response[0].result,
        buildtime: new Date(response.data.response[0].result.buildtime),
      };
    },
  });
}

export function useInfoTabData() {
  const api = useAxiosWithAuth();

  return useSuspenseQuery({
    queryKey: ["infoTabData"],
    queryFn: async () => {
      const response = await api.get<APIResponse<InfoTabResponse>>("/bmc", {
        params: {
          opt: "get",
          type: "info",
        },
      });
      return response.data.response[0].result;
    },
  });
}

export function useNodesTabData() {
  const api = useAxiosWithAuth();

  return useSuspenseQuery({
    queryKey: ["nodesTabData"],
    queryFn: async () => {
      const response = await api.get<APIResponse<NodeInfoResponse[]>>("/bmc", {
        params: {
          opt: "get",
          type: "node_info",
        },
      });
      return response.data.response[0].result;
    },
  });
}

export function useFlashStatusQuery(enabled: boolean) {
  const api = useAxiosWithAuth();

  return useQuery({
    queryKey: ["flashStatus"],
    staleTime: 1000, // Valid for 1 second
    queryFn: async () => {
      const response = await api.get<FlashStatus>("/bmc", {
        params: {
          opt: "get",
          type: "flash",
        },
      });
      return response.data;
    },
    refetchInterval: 1000, // Refetch every 1 second
    enabled, // Enable/disable the query based on the provided boolean value
  });
}

export function useFirmwareStatusQuery(enabled: boolean) {
  const api = useAxiosWithAuth();

  return useQuery({
    queryKey: ["firmwareStatus"],
    staleTime: 1000, // Valid for 1 second
    queryFn: async () => {
      const response = await api.get<FlashStatus>("/bmc", {
        params: {
          opt: "get",
          type: "firmware",
        },
      });
      return response.data;
    },
    refetchInterval: 1000, // Refetch every 1 second
    enabled, // Enable/disable the query based on the provided boolean value
  });
}

export function useCoolingDevicesQuery() {
  const api = useAxiosWithAuth();

  return useSuspenseQuery({
    queryKey: ["coolingDevices"],
    queryFn: async () => {
      const response = await api.get<APIResponse<CoolingDevice[]>>("/bmc", {
        params: {
          opt: "get",
          type: "cooling",
        },
      });
      return response.data.response[0].result;
    },
  });
}

export function useUSBNode1Query() {
  const api = useAxiosWithAuth();

  return useSuspenseQuery({
    queryKey: ["usbNode1"],
    queryFn: async () => {
      const response = await api.get<APIResponse<boolean>>("/bmc", {
        params: {
          opt: "get",
          type: "usb_node1",
        },
      });

      return response.data.response[0].result;
    },
  });
}
