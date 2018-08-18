mkdir -p keys
ssh-keygen -t rsa -b 4096 -f keys/jwt.key
openssl rsa -in keys/jwt.key -pubout -outform PEM -out keys/jwt.key.pub
