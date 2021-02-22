docker-build:
	docker build -t ecb-chatbot -f ./Dockerfile .
	docker tag ecb-chatbot ecb-chatbot:1.0.0
