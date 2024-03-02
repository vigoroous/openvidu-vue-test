sudo docker run --network=host --name openvidu openvidu/openvidu-dev

sudo docker run \
    -d \
    -e DOMAIN_OR_PUBLIC_IP="192.168.0.50" \
    -p 4443:4443 \
    --name openvidu \
    openvidu/openvidu-dev
