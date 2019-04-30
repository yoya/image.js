<?php

$table = [];
foreach (file($argv[1]) as $line) {
    $table []= explode(',', trim($line));
}

echo "[".PHP_EOL;
for ($x = 2; $x < count($table[0]) ; $x += 3) {
    echo " {".PHP_EOL;
    $Number = $table[0][$x];
    $ObserverID = $table[1][$x];
    $Sex = $table[2][$x];
    $Age = $table[3][$x];
    $Conditions = $table[4][$x];
    $Name = $table[5][$x];
    echo "  \"Number\":$Number, \"ObserverID\":\"$ObserverID\", \"Sex\":\"$Sex\", \"Age\":$Age, \"Conditions\":\"$Conditions\", \"Name\":\"$Name\",".PHP_EOL;
    echo "  \"WRGB\":[".PHP_EOL;
    for ($y = 7 ; $y < count($table) ; $y++) {
        $W = $table[$y][1];
        $R = $table[$y][$x];
        $G = $table[$y][$x+1];
        $B = $table[$y][$x+2];
        if (($W != "") && ($R != "") && ($G != "") && ($B != "")) {
            if ($y+1 < count($table)) {
                echo "    [$W, $R, $G, $B],".PHP_EOL;
            } else {
                echo "    [$W, $R, $G, $B]".PHP_EOL;
            }
        } else {
            if (($R != "") || ($G != "") || ($B != "")) {
                fprintf(STDERR, "Error: W:'$W', R:'$R', G:'$G', B:'$B'".PHP_EOL);                
            }
        }
    }
    echo "  ]".PHP_EOL;
    if ($x + 3 < count($table[0])) {
        echo " },".PHP_EOL;
    } else {
        echo " }".PHP_EOL;
    }
}
echo "]".PHP_EOL;
