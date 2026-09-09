import { Client, type StompSubscription, type IMessage } from '@stomp/stompjs'
import { getAccessToken } from './apiClient'

export type MessageHandler<T = unknown> = (payload: T) => void

function getBrokerUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
  try {
    const url = new URL(apiBase, window.location.origin)
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${url.host}/ws`
  } catch {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//localhost:8080/ws`
  }
}

class WebSocketService {
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private onConnectCallbacks: Set<() => void> = new Set()
  private onDisconnectCallbacks: Set<() => void> = new Set()

  public addOnConnectListener(cb: () => void): () => void {
    this.onConnectCallbacks.add(cb)
    if (this.client?.connected) {
      cb()
    }
    return () => this.onConnectCallbacks.delete(cb)
  }

  public addOnDisconnectListener(cb: () => void): () => void {
    this.onDisconnectCallbacks.add(cb)
    return () => this.onDisconnectCallbacks.delete(cb)
  }

  public connect(): void {
    const token = getAccessToken()
    if (!token) {
      return
    }

    if (this.client?.active) {
      return
    }

    const brokerURL = getBrokerUrl()

    this.client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.onConnectCallbacks.forEach((cb) => {
          try {
            cb()
          } catch (e) {
            console.error('Error in onConnect callback', e)
          }
        })
      },
      onDisconnect: () => {
        this.subscriptions.clear()
        this.onDisconnectCallbacks.forEach((cb) => {
          try {
            cb()
          } catch (e) {
            console.error('Error in onDisconnect callback', e)
          }
        })
      },
      onStompError: (frame) => {
        console.warn('STOMP broker error:', frame.headers['message'], frame.body)
      },
      onWebSocketError: (event) => {
        console.warn('WebSocket error:', event)
      },
    })

    this.client.activate()
  }

  public disconnect(): void {
    if (this.client) {
      this.subscriptions.clear()
      this.client.deactivate()
      this.client = null
    }
  }

  public subscribe<T = unknown>(destination: string, handler: MessageHandler<T>): () => void {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination)!.unsubscribe()
      this.subscriptions.delete(destination)
    }

    const doSubscribe = () => {
      if (!this.client || !this.client.connected) {
        return
      }
      try {
        const sub = this.client.subscribe(destination, (msg: IMessage) => {
          try {
            const data = JSON.parse(msg.body) as T
            handler(data)
          } catch (err) {
            console.error('Failed to parse STOMP message', err, msg.body)
          }
        })
        this.subscriptions.set(destination, sub)
      } catch (err) {
        console.error(`Failed to subscribe to ${destination}`, err)
      }
    }

    if (this.client?.connected) {
      doSubscribe()
    }

    const removeOnConnect = this.addOnConnectListener(() => {
      doSubscribe()
    })

    return () => {
      removeOnConnect()
      const sub = this.subscriptions.get(destination)
      if (sub) {
        sub.unsubscribe()
        this.subscriptions.delete(destination)
      }
    }
  }

  public isConnected(): boolean {
    return !!this.client?.connected
  }
}

export const webSocketService = new WebSocketService()
