FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:/usr/lib/jvm/java-21-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-21-jdk unzip wget ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/android-sdk/cmdline-tools /opt/android-sdk/licenses

RUN wget -O /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
  && unzip -q /tmp/cmdline-tools.zip -d /opt/android-sdk/cmdline-tools \
  && mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest \
  && rm -f /tmp/cmdline-tools.zip

RUN yes | sdkmanager --licenses >/dev/null \
  && sdkmanager \
    "platform-tools" \
    "platforms;android-35" \
    "build-tools;35.0.0"

WORKDIR /workspace
