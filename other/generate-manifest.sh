#!/bin/bash

echo "CACHE MANIFEST"
echo "#Generated: $(date)"
echo "CACHE:"
echo "/"
find . -type f -not -path "*.git/*" -not -path "*.DS_Store" -not -path "*.gitignore" |
while read i; do
  if [ "${i:2}" != "$(basename $0)" ]; then
    if [[ $i == \./* ]]; then
      echo "${i:2}"
    else
      echo $i
    fi
  fi
done
echo "NETWORK:"
echo "*"