FROM openjdk:8u171-jdk as builder
ENV SMEAGOL_DIR=/usr/src/smeagol
COPY mvnw pom.xml package.json package-lock.json ${SMEAGOL_DIR}/
COPY .mvn ${SMEAGOL_DIR}/.mvn
# We resolve dependencies before copying src so we profit from dockers caching behavior
RUN set -x \
 && cd ${SMEAGOL_DIR} \
 && ./mvnw dependency:resolve
COPY src ${SMEAGOL_DIR}/src
RUN set -x \
 && cd ${SMEAGOL_DIR} \
 && ./mvnw package

FROM registry.cloudogu.com/official/java:8u191-1
LABEL maintainer="Sebastian Sdorra <sebastian.sdorra@cloudogu.com>"
ENV SERVICE_TAGS=webapp \
    SMEAGOL_HOME=/var/lib/smeagol

COPY --from=builder /usr/src/smeagol/target/smeagol.war /app/smeagol.war
COPY ces-startup.sh /app/startup.sh

VOLUME ${SMEAGOL_HOME}
EXPOSE 8080

WORKDIR /app
CMD /app/startup.sh
