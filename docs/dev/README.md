# HyperCloud Console Chatbot Development

## 개발 환경 세팅

### Install & Start

1. Node.js 12.x.x 설치

- node > 12.0.0 && node < 13

2. Git clone

```
git clone https://github.com/tmax-cloud/botpress
```

3. Install yarn

```
npm install -g yarn
```

4. Install node_modules

```
yarn
```

5. Build

```
yarn build
```

6. Run

```
yarn start
```

### Live Reloading

[Local Development Tips](https://botpress.com/docs/building-chatbots/developers/custom-modules) 참고

1. Creates a symlink to modules bundles

```
yarn cmd dev:modules
```

2. Run

```
yarn start
```

3. Watch

새 터미널 열고 아래 커맨드 실행

```
cd /modules/channel-web/
yarn watch
```

### Connecting to Hypercloud Console Bot

1. `chatbot.tmaxcloud.org`에서 봇 Export
2. 로컬 환경에서 Export한 파일(.tgz)을 Import

> 임포트한 봇은 동기화가 안되기 때문에 매번 export/import 해줘야 함. 프로세스 개선 필요
