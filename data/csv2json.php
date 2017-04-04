<?php

echo "[".PHP_EOL;
foreach (file($argv[1]) as $line) {
    echo "  [" . trim($line) . "],".PHP_EOL;
}
echo "]".PHP_EOL;

// remove comma of tail manually.
