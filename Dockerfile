FROM node:18-bullseye-slim AS build
WORKDIR /usr/src/app
COPY . /usr/src/app/
RUN npm install --omit=dev


FROM gcr.io/distroless/nodejs:18
COPY --from=build /usr/src/app /usr/src/app
WORKDIR /usr/src/app

ENV PUSH_NOTIFICATION_SERVICE_HOST=pns
ENV PUSH_NOTIFICATION_SERVICE_PORT=3000
ENV PUSH_NOTIFICATION_SERVICE_PATH=/sbc-fcm-api/v1/messages/account/single
ENV TOPIC_KEY=comissions.created

CMD [ "worker.js" ]